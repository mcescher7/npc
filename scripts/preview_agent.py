import os
import re
import sys
import json
import time
import requests
import psycopg2
import pyperclip
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ServerError, ClientError

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SLEEPER_LEAGUE_ID = "1380112697919561728"


def get_sleeper_player_projections(season: int, week: int):
    """Holt die offiziellen Spieler-Projections direkt von der Sleeper API."""
    try:
        resp = requests.get(
            f"https://api.sleeper.app/v1/projections/nfl/regular/{season}/{week}",
            timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            projections = {}
            for pid, pdata in data.items():
                if isinstance(pdata, dict):
                    stats = pdata.get("stats", pdata)
                    pts = stats.get("pts_ppr") or stats.get("pts_half_ppr") or stats.get("pts_std")
                    if pts is not None:
                        projections[str(pid)] = round(float(pts), 2)
            return projections
    except Exception as e:
        print(f"Hinweis: Sleeper-Projections konnten nicht geladen werden ({e}).")
    return {}


def get_current_matchups_and_starters_from_sleeper(league_id: str, week: int):
    """Holt Matchups, Tabellenstände, Starter und bereits erzielte Live-Punkte von Sleeper."""
    print(f"Lade Matchups, Aufstellungen und Live-Scores für Woche {week} von Sleeper...")
    
    # 1. Rosters laden
    rosters_resp = requests.get(f"https://api.sleeper.app/v1/league/{league_id}/rosters")
    rosters_resp.raise_for_status()
    rosters_list = rosters_resp.json()

    # Tabelle sortieren: 1) Siege (DESC), 2) Erzielte Gesamtpunkte (DESC)
    def calculate_sort_key(r):
        settings = r.get("settings", {})
        wins = settings.get("wins", 0)
        fpts = float(f"{settings.get('fpts', 0)}.{settings.get('fpts_decimal', 0):02d}")
        return (wins, fpts)

    sorted_rosters = sorted(rosters_list, key=calculate_sort_key, reverse=True)

    roster_info = {}
    for rank, r in enumerate(sorted_rosters, start=1):
        settings = r.get("settings", {})
        wins = settings.get("wins", 0)
        losses = settings.get("losses", 0)
        ties = settings.get("ties", 0)
        fpts = float(f"{settings.get('fpts', 0)}.{settings.get('fpts_decimal', 0):02d}")

        record_str = f"{wins}-{losses}" + (f"-{ties}" if ties > 0 else "")

        roster_info[r["roster_id"]] = {
            "sleeper_id": str(r["owner_id"]),
            "rank": rank,
            "record": record_str,
            "wins": wins,
            "losses": losses,
            "ties": ties,
            "points_for": fpts
        }

    # 2. Matchups der Woche laden
    matchups_resp = requests.get(f"https://api.sleeper.app/v1/league/{league_id}/matchups/{week}")
    matchups_resp.raise_for_status()
    matchups_data = matchups_resp.json()

    grouped_matchups = {}
    for entry in matchups_data:
        m_id = entry.get("matchup_id")
        if m_id is None:
            continue
        
        r_id = entry["roster_id"]
        info = roster_info.get(r_id, {})
        
        starters = [str(pid) for pid in entry.get("starters", []) if pid and str(pid) != "0"]
        starters_points = entry.get("starters_points", [])
        
        # Gespielte Starter erfassen (Punkte != 0 bzw. nicht None)
        played_starters_dict = {}
        if starters and starters_points:
            for s_id, pts in zip(entry.get("starters", []), starters_points):
                if s_id and str(s_id) != "0" and pts is not None and pts != 0:
                    played_starters_dict[str(s_id)] = round(float(pts), 2)

        grouped_matchups.setdefault(m_id, []).append({
            "sleeper_id": info.get("sleeper_id"),
            "rank": info.get("rank"),
            "current_record": info.get("record", "0-0"),
            "points_for": info.get("points_for", 0.0),
            "starters": starters,
            "played_starters_dict": played_starters_dict,
            "live_week_points": round(float(entry.get("points", 0.0)), 2)
        })

    paired_matchups = []
    for m_id, teams in grouped_matchups.items():
        if len(teams) == 2:
            paired_matchups.append((teams[0], teams[1]))
    
    return paired_matchups


def check_player_milestones(cursor, manager_id: int, starter_player_ids: list):
    """Ermittelt Meilensteine und prüft, ob Top-3-Spieler in Einsätzen eingeholt oder überholt werden."""
    if not starter_player_ids:
        return []

    numeric_player_ids = []
    for pid in starter_player_ids:
        try:
            numeric_player_ids.append(int(pid))
        except (ValueError, TypeError):
            continue

    if not numeric_player_ids:
        return []

    milestones = []
    
    cursor.execute("""
        SELECT player_id, player_name, manager_id, games, points
        FROM player_team_stats
        WHERE player_id = ANY(%s::int[]) 
          AND (manager_id = %s OR manager_id IS NULL);
    """, (numeric_player_ids, manager_id))
    stats_rows = cursor.fetchall()

    player_data = {}
    for row in stats_rows:
        pid = row["player_id"]
        player_data.setdefault(pid, {})
        if row["manager_id"] is None:
            player_data[pid]["total"] = row
        else:
            player_data[pid]["team"] = row

    cursor.execute("""
        SELECT player_id, player_name, games
        FROM player_team_stats
        WHERE manager_id = %s AND games IS NOT NULL
        ORDER BY games DESC;
    """, (manager_id,))
    all_team_players = cursor.fetchall()

    for pid, data in player_data.items():
        p_name = None
        team_stat = data.get("team")
        total_stat = data.get("total")

        if team_stat:
            p_name = team_stat["player_name"]
            curr_team_games = team_stat["games"] or 0
            next_team_game = curr_team_games + 1

            if next_team_game in [25, 50, 75, 100, 150]:
                milestones.append(f"{p_name}: Bestreitet sein {next_team_game}. Spiel für dieses Team")

            other_players = [row for row in all_team_players if row["player_id"] != pid]
            for rank_idx, target in enumerate(other_players[:3], start=1):
                target_games = target["games"] or 0
                target_name = target["player_name"]

                if target_games <= 0:
                    continue

                if next_team_game == target_games and curr_team_games < target_games:
                    milestones.append(
                        f"{p_name}: Zieht mit seinem {next_team_game}. Start für das Team mit {target_name} gleich "
                        f"(geteilt Platz {rank_idx} der Franchise-Historie)"
                    )
                elif curr_team_games == target_games and next_team_game > target_games:
                    milestones.append(
                        f"{p_name}: Überholt mit seinem {next_team_game}. Start für das Team {target_name} "
                        f"und übernimmt alleinigen Platz {rank_idx} der Franchise-Historie"
                    )

        if total_stat:
            p_name = p_name or total_stat["player_name"]
            curr_total_games = total_stat["games"] or 0
            next_total_game = curr_total_games + 1

            if next_total_game in [50, 100, 150, 200]:
                milestones.append(f"{p_name}: Vor dem {next_total_game}. Karrierespiel in der Liga")

            tot_pts = float(total_stat["points"] or 0)
            for threshold in [500, 1000, 1500, 2000]:
                if tot_pts < threshold and (threshold - tot_pts) <= 25.0:
                    milestones.append(f"{p_name}: Nur noch {threshold - tot_pts:.1f} Punkte bis zum Meilenstein von {threshold} Liga-Karrierepunkten")

    return milestones


def fetch_league_data(matchup_pairs, week: int, season: int):
    """Fragt gezielt die relevanten Supabase-Tabellen ab und holt Projections von Sleeper."""
    print("Frage Supabase-Datenbank ab...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT 
            m.manager_id, 
            m.name as manager_name, 
            m.sleeper_id, 
            t.teamname 
        FROM managers m
        LEFT JOIN teamnames t 
            ON m.manager_id = t.manager_id 
            AND t.tn_end IS NULL;
    """)
    managers_list = cursor.fetchall()
    sleeper_to_mgr = {str(row["sleeper_id"]): row for row in managers_list}

    # Gespielte Spieler-IDs sammeln
    all_played_pids = set()
    for team_a_info, team_b_info in matchup_pairs:
        all_played_pids.update(team_a_info.get("played_starters_dict", {}).keys())
        all_played_pids.update(team_b_info.get("played_starters_dict", {}).keys())

    numeric_played_pids = []
    for pid in all_played_pids:
        try:
            numeric_played_pids.append(int(pid))
        except (ValueError, TypeError):
            pass

    # Namen der gespielten Spieler auflösen
    player_name_map = {}
    if numeric_played_pids:
        cursor.execute("""
            SELECT DISTINCT player_id, player_name
            FROM player_team_stats
            WHERE player_id = ANY(%s::int[]);
        """, (numeric_played_pids,))
        for row in cursor.fetchall():
            player_name_map[str(row["player_id"])] = row["player_name"]

    # Projections über Sleeper API laden
    projections_map = get_sleeper_player_projections(season, week)

    compiled_matchups = []

    for team_a_info, team_b_info in matchup_pairs:
        sleeper_a = team_a_info["sleeper_id"]
        sleeper_b = team_b_info["sleeper_id"]

        mgr_a = sleeper_to_mgr.get(str(sleeper_a))
        mgr_b = sleeper_to_mgr.get(str(sleeper_b))

        if not mgr_a or not mgr_b:
            print(f"Warnung: Sleeper-ID {sleeper_a} oder {sleeper_b} nicht in DB 'managers' gefunden.")
            continue

        id_a = mgr_a["manager_id"]
        id_b = mgr_b["manager_id"]

        cursor.execute("""
            SELECT 
                year, 
                week, 
                manager_points, 
                opponent_points,
                manager_proj,
                opponent_proj
            FROM matchups
            WHERE manager_id = %s AND opponent_id = %s
            ORDER BY year DESC, week DESC;
        """, (id_a, id_b))
        h2h_games = cursor.fetchall()

        wins_a = sum(1 for g in h2h_games if (g["manager_points"] or 0) > (g["opponent_points"] or 0))
        wins_b = sum(1 for g in h2h_games if (g["opponent_points"] or 0) > (g["manager_points"] or 0))
        ties = sum(1 for g in h2h_games if (g["manager_points"] or 0) == (g["opponent_points"] or 0))

        cursor.execute("""
            SELECT manager_id, playoff_pct 
            FROM playoff_odds 
            WHERE manager_id IN (%s, %s)
            ORDER BY year DESC, week DESC;
        """, (id_a, id_b))
        odds = cursor.fetchall()

        playoff_pct_a = next((o["playoff_pct"] for o in odds if o["manager_id"] == id_a), None)
        playoff_pct_b = next((o["playoff_pct"] for o in odds if o["manager_id"] == id_b), None)

        milestones_a = check_player_milestones(cursor, id_a, team_a_info.get("starters", []))
        milestones_b = check_player_milestones(cursor, id_b, team_b_info.get("starters", []))

        def format_played_starters(played_dict):
            result = []
            for pid, actual_pts in played_dict.items():
                p_name = player_name_map.get(pid, f"Spieler #{pid}")
                proj_pts = projections_map.get(pid)
                item = {
                    "player": p_name,
                    "actual_points": actual_pts,
                    "projected_points": proj_pts,
                }
                if proj_pts is not None:
                    item["diff_to_proj"] = round(actual_pts - proj_pts, 2)
                    item["verdict"] = "Boom (über Erwartung)" if (actual_pts - proj_pts) >= 4.0 else (
                        "Bust (deutlich unter Erwartung)" if (actual_pts - proj_pts) <= -4.0 else "Im Soll"
                    )
                result.append(item)
            return result

        played_starters_a = format_played_starters(team_a_info.get("played_starters_dict", {}))
        played_starters_b = format_played_starters(team_b_info.get("played_starters_dict", {}))

        compiled_matchups.append({
            "team_a": {
                "manager": mgr_a["manager_name"],
                "teamname": mgr_a["teamname"] or mgr_a["manager_name"],
                "standing_rank": team_a_info["rank"],
                "current_season_record": team_a_info["current_record"],
                "total_points_scored": team_a_info["points_for"],
                "playoff_odds": playoff_pct_a,
                "player_milestones": milestones_a,
                "live_week_points": team_a_info.get("live_week_points", 0.0),
                "already_played_starters": played_starters_a
            },
            "team_b": {
                "manager": mgr_b["manager_name"],
                "teamname": mgr_b["teamname"] or mgr_b["manager_name"],
                "standing_rank": team_b_info["rank"],
                "current_season_record": team_b_info["current_record"],
                "total_points_scored": team_b_info["points_for"],
                "playoff_odds": playoff_pct_b,
                "player_milestones": milestones_b,
                "live_week_points": team_b_info.get("live_week_points", 0.0),
                "already_played_starters": played_starters_b
            },
            "h2h_summary": {
                "total_games": len(h2h_games),
                "record": f"{wins_a} - {wins_b}" + (f" - {ties}" if ties else ""),
                "wins_team_a": wins_a,
                "wins_team_b": wins_b,
                "past_games": h2h_games[:6]
            }
        })

    conn.close()
    return compiled_matchups


def convert_to_whatsapp_format(text: str) -> str:
    """Wandelt Standard-Markdown in WhatsApp-Format um und eliminiert überflüssige Leerzeilen."""
    lines = text.split("\n")
    formatted_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            formatted_lines.append("")
            continue

        if stripped.startswith("### ") or stripped.startswith("## "):
            clean_title = re.sub(r"^#+\s*", "", stripped)
            formatted_lines.append("━━━━━━━━━━━━━━━━━━━━")
            formatted_lines.append(f"*{clean_title.upper()}*")
        elif stripped.startswith("# "):
            clean_title = re.sub(r"^#+\s*", "", stripped)
            formatted_lines.append(f"🏈 *{clean_title.upper()}* 🏈")
        else:
            converted = re.sub(r"\*\*(.*?)\*\*", r"*\1*", line)
            formatted_lines.append(converted)

    raw_converted = "\n".join(formatted_lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", raw_converted)
    return cleaned.strip()


def generate_preview(week: int, season: int):
    pairs = get_current_matchups_and_starters_from_sleeper(SLEEPER_LEAGUE_ID, week)
    data = fetch_league_data(pairs, week, season)

    prompt = f"""
    Hier sind die offiziellen Paarungen, die aktuellen Saison-Bilanzen mit exakten Tabellenplätzen, historische Matchups, Meilensteine und bereits absolvierte Einsätze mit Soll-/Ist-Vergleichen (Projections vs. Actual Points) für Woche {week} (Saison {season}):

    {json.dumps(data, indent=2, ensure_ascii=False, default=str)}

    Verfasse nun die wöchentliche Spieltagsvorschau.

    WICHTIGE VORGABEN:
    1. ÜBERSCHRIFTEN-REGEL FÜR MATCHUPS (STRIKT EINHALTEN!):
       Unter der kreativen Storyline-Überschrift muss die Paarungszeile EXAKT so lauten:
       **[Teamname A] ([Record A]) vs. [Teamname B] ([Record B])**
       -> Nach dem Teamnamen darf NUR der Saison-Record in Klammern stehen!
       -> KEIN Tabellenplatz und KEIN Managername in dieser Zeile!
       (Beispiel: **Vienna Vikings (4-1) vs. Munich Monsters (2-3)**)
       Die Managernamen und Tabellenplätze baust du dafür natürlich im Fließtext ein.

    2. BEREITS GESPIELTE STARTER / PROJECTIONS-VERGLEICH ('already_played_starters'):
       Falls Spieler dieser Partie bereits angetreten sind (z. B. im Thursday Night Game):
       Ordne ihre Leistung im Fließtext ein und vergleiche ihre tatsächlichen Punkte ('actual_points') mit ihren prognostizierten Punkten ('projected_points'):
       - Hat ein Spieler geliefert und seine Projection übertroffen (Boom, z. B. +6 Punkte über Erwartung)?
       - Oder war es ein herber Dämpfer / Bust (deutlich unter Projection geblieben)?
       - Wie verändert dieses frühe Polster bzw. Defizit die Siegchancen für den restlichen Spieltag?
       Falls keine Spieler in der Liste stehen, hat für dieses Duell noch niemand gespielt.

    3. ABWECHSLUNG & KEIN SCHEMA F:
       Wähle für jedes Duell individuell passende Schwerpunkte (Rivalität, Meilenstein, Playoff-Druck, gelaufene Donnerstagspiele oder Tabellenduelle).

    4. AUSFÜHRLICHKEIT:
       Schreibe pro Matchup ausführlich (ca. 8 bis 12 Sätze Zeit für den Fließtext).

    STRUKTUR:
    # SPIELTAGSVORSCHAU WOCHE {week}
    
    [Einleitung: 2-3 Sätze zur aktuellen Ligastimmung vor Woche {week}.]

    Pro Matchup exakt folgendes Schema:

    ### [Kreative Überschrift zur Storyline des Spiels]
    **[Teamname A] ([Record A]) vs. [Teamname B] ([Record B])**

    [Hier folgt GENAU EIN zusammenhängender, detaillierter Fließtext-Absatz (ca. 8 bis 12 Sätze, OHNE Zwischenüberschriften, OHNE Stichpunkte).]

    **Redaktioneller Tipp:** [Pointierte Sieger-Vorhersage mit Begründung in einem Satz.]
    """

    client = genai.Client(api_key=GEMINI_API_KEY)

    candidate_models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
    ]

    config_no_thinking = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0),
        temperature=0.7,
    )

    for model_name in candidate_models:
        print(f"\n[Modell-Start] Frage {model_name} an...")
        try:
            try:
                response_stream = client.models.generate_content_stream(
                    model=model_name,
                    contents=prompt,
                    config=config_no_thinking
                )
            except Exception:
                response_stream = client.models.generate_content_stream(
                    model=model_name,
                    contents=prompt
                )

            full_text = []
            print(f"[Live-Ausgabe {model_name}]:\n")
            
            for chunk in response_stream:
                if chunk.text:
                    print(chunk.text, end="", flush=True)
                    full_text.append(chunk.text)
                else:
                    print(".", end="", flush=True)

            print(f"\n\n✅ Fertig generiert mit {model_name}!")
            return "".join(full_text)

        except ServerError:
            print(f"\n⚠️ {model_name} überlastet (503). Springe direkt zum nächsten Modell...")
            continue
        except ClientError as e:
            if "404" in str(e) or "NOT_FOUND" in str(e):
                print(f"\nModell {model_name} nicht verfügbar (404), nächstes...")
                continue
            raise e
        except Exception as e:
            print(f"\nFehler bei {model_name}: {e}. Probiere nächstes...")
            continue

    raise RuntimeError("Keines der Modelle konnte antworten.")


if __name__ == "__main__":
    spieltag = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    saison = 2026

    # 1. Bericht generieren & formatieren
    markdown_preview = generate_preview(week=spieltag, season=saison)
    wa_preview = convert_to_whatsapp_format(markdown_preview)

    # 2. In die Zwischenablage kopieren (falls Zwischenablage lokal verfügbar ist)
    try:
        pyperclip.copy(wa_preview)
        clipboard_status = "✅ In die ZWISCHENABLAGE kopiert!"
    except Exception as e:
        clipboard_status = f"⚠️ Konnte nicht in Zwischenablage kopieren (z. B. auf Linux/Server normal): {e}"

    # 3. Output-Ordner anlegen & Datei speichern
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    
    file_path = os.path.join(output_dir, f"preview_woche_{spieltag}_whatsapp.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(wa_preview)

    print("\n" + "=" * 60)
    print(f"WHATSAPP-VORSCHAU - WOCHE {spieltag}")
    print("=" * 60 + "\n")
    print(wa_preview)
    print("\n" + "=" * 60)
    print(clipboard_status)
    print(f"Gespeichert in: {file_path}")
