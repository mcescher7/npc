import csv
from datetime import datetime
import json
from pathlib import Path
import time
from zoneinfo import ZoneInfo

import pandas as pd
import requests
from sleeper_wrapper import Drafts, League

# =============================================================================
# GLOBALE KONFIGURATION & MAPPINGS
# =============================================================================
BERLIN_TZ = ZoneInfo("Europe/Berlin")
EASTERN_TZ = ZoneInfo("US/Eastern")

VALID_POSITIONS = {"QB", "RB", "FB", "WR", "TE", "K"}
ROSTER_SLOTS = [
    "qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "wr3",
    "te", "flex1", "flex2", "k", "d/st"
] + [f"bn{i}" for i in range(1, 17)]

TEAM_DST_MAPPING = {
    'ARI': 99901, 'ATL': 99902, 'BAL': 99903, 'BUF': 99904, 'CAR': 99905,
    'CHI': 99906, 'CIN': 99907, 'CLE': 99908, 'DAL': 99909, 'DEN': 99910,
    'DET': 99911, 'GB': 99912, 'HOU': 99913, 'IND': 99914, 'JAX': 99915,
    'KC': 99916, 'LAC': 99917, 'LAR': 99918, 'LV': 99919, 'MIA': 99920,
    'MIN': 99921, 'NE': 99922, 'NO': 99923, 'NYG': 99924, 'NYJ': 99925,
    'PHI': 99926, 'PIT': 99927, 'SEA': 99928, 'SF': 99929, 'TB': 99930,
    'TEN': 99931, 'WAS': 99932
}
REVERSE_TEAM_DST_MAPPING = {v: k for k, v in TEAM_DST_MAPPING.items()}

# Roster-ID zu Manager-ID (1-basiert)
ROSTER_TO_MANAGER = {
    1: 2, 2: 14, 3: 11, 4: 10, 5: 12, 6: 9, 7: 6, 8: 5
}
# 0-basierter Index für Matchup-Arrays
INDEX_TO_MANAGER = {
    0: 2, 1: 14, 2: 11, 3: 10, 4: 12, 5: 9, 6: 6, 7: 5
}


# =============================================================================
# HILFSFUNKTIONEN
# =============================================================================
def ensure_players_json(max_age_seconds: int = 86400) -> Path:
    """Lädt players.json nur herunter, wenn die Datei älter als max_age_seconds ist."""
    players_file = Path("players.json")
    url = "https://api.sleeper.app/v1/players/nfl"

    if not players_file.exists() or (time.time() - players_file.stat().st_mtime > max_age_seconds):
        print("Lade players.json von Sleeper API herunter...")
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        with players_file.open("w", encoding="utf-8") as f:
            f.write(resp.text)
    return players_file


def format_birth_date(date_str: str | None) -> str | None:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d.%m.%Y")
    except ValueError:
        return None


# =============================================================================
# PIPELINE-FUNKTIONEN
# =============================================================================
def update_players(year: int):
    print("updating players...")
    players_file = ensure_players_json()

    # Relevante IDs aus Roster, Transactions und Draft sammeln
    valid_player_ids = set()

    for filename in [f"rosters_{year}.csv", f"transactions_{year}.csv", f"draft_{year}.csv"]:
        path = Path(filename)
        if not path.exists():
            continue
        df = pd.read_csv(path)
        if "player_id" in df.columns:
            valid_player_ids.update(df["player_id"].dropna().astype(str).str.strip())
        else:
            cols = [c for c in ROSTER_SLOTS if c in df.columns]
            for col in cols:
                valid_player_ids.update(df[col].dropna().astype(str).str.strip())

    with players_file.open("r", encoding="utf-8") as f:
        players = json.load(f)

    columns = [
        "player_id", "first_name", "last_name", "position", "team",
        "birth_date", "number", "rookie_year", "height", "weight", "college"
    ]

    output_file = f"players_{year}.csv"
    with open(output_file, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()

        for player_id, data in players.items():
            if str(player_id) not in valid_player_ids:
                continue
            if data.get("position") not in VALID_POSITIONS:
                continue

            metadata = data.get("metadata") or {}
            writer.writerow({
                "player_id": player_id,
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "position": data.get("position"),
                "team": data.get("team"),
                "birth_date": format_birth_date(data.get("birth_date")),
                "number": data.get("number"),
                "rookie_year": metadata.get("rookie_year"),
                "height": data.get("height"),
                "weight": data.get("weight"),
                "college": data.get("college"),
            })

    print(f"updating players complete ({len(valid_player_ids)} valid IDs berücksichtigt)")


def update_transactions(league_nr: int, year: int):
    print("updating transactions...")
    league = League(league_nr)

    transactions = []
    for week in range(1, 18):
        transactions.extend(league.get_transactions(week) or [])

    if not transactions:
        print("Keine Transaktionen gefunden.")
        return

    df = pd.DataFrame(transactions)
    df = df[df["status"] == "complete"].copy()
    df.rename(columns={"type": "from", "leg": "week"}, inplace=True)

    # Zeitumrechnung mit ZoneInfo
    df["time"] = (
        pd.to_datetime(df["status_updated"], unit="ms", utc=True)
        .dt.tz_convert(BERLIN_TZ)
        .dt.tz_localize(None)
        .dt.floor("min")
    )

    long = df.melt(
        id_vars=["time", "week", "from", "settings"],
        value_vars=["adds", "drops"],
        var_name="type",
        value_name="mapping",
    ).dropna(subset=["mapping"])

    long["type"] = long["type"].map({"adds": "add", "drops": "drop"})
    long["player_id"] = long["mapping"].apply(lambda d: list(d.keys()) if isinstance(d, dict) else [])
    long["manager_id"] = long["mapping"].apply(lambda d: list(d.values()) if isinstance(d, dict) else [])
    long = long.explode(["player_id", "manager_id"])

    long["manager_id"] = long["manager_id"].map(ROSTER_TO_MANAGER)
    long["player_id"] = long["player_id"].map(TEAM_DST_MAPPING).fillna(long["player_id"]).astype(int)

    long["info"] = long.apply(
        lambda r: f"FAAB: {r['settings'].get('waiver_bid')}"
        if r["type"] == "add" and isinstance(r["settings"], dict) and "waiver_bid" in r["settings"]
        else "",
        axis=1
    )
    long["target"] = long["from"]

    result = long[["time", "week", "manager_id", "player_id", "info", "type", "target"]].sort_values(
        by=["time", "manager_id", "type", "player_id"]
    )
    result.to_csv(f"transactions_{year}.csv", index=False)
    print("updating transactions complete")


def update_draft(draft_nr: int, year: int):
    print("updating draft...")
    draft = Drafts(draft_nr)
    all_picks = draft.get_all_picks()

    df = pd.DataFrame(all_picks)[["round", "pick_no", "player_id", "roster_id"]].copy()
    df["manager_id"] = df["roster_id"].map(ROSTER_TO_MANAGER)
    df.drop(columns=["roster_id"], inplace=True)

    df["player_id"] = df["player_id"].map(TEAM_DST_MAPPING).fillna(df["player_id"]).astype(int)
    df["year"] = year

    df.to_csv(f"draft_{year}.csv", index=False)
    print("updating draft complete")


def update_games(year: int):
    print("updating games...")
    url = "https://raw.githubusercontent.com/nflverse/nfldata/refs/heads/master/data/games.csv"
    df = pd.read_csv(url)

    df = df[(df["season"] == year) & (df["week"] <= 17)].copy()
    df = df[["game_id", "season", "week", "away_team", "home_team", "away_score", "home_score", "gameday", "gametime"]]
    df.rename(columns={"season": "year"}, inplace=True)

    df["game_id"] = df["game_id"].str.replace(r'(_LA_)|(_LA$)', lambda m: m.group(0).replace("LA", "LAR"), regex=True)
    df["home_team"] = df["home_team"].replace("LA", "LAR")
    df["away_team"] = df["away_team"].replace("LA", "LAR")
    df["away_score"] = pd.to_numeric(df["away_score"], errors="coerce").astype("Int64")
    df["home_score"] = pd.to_numeric(df["home_score"], errors="coerce").astype("Int64")

    # Zeitzonen-Konvertierung
    def parse_time(row):
        try:
            naive = datetime.strptime(f"{row['gameday']} {row['gametime']}", "%Y-%m-%d %H:%M")
            return naive.replace(tzinfo=EASTERN_TZ).astimezone(BERLIN_TZ).replace(tzinfo=None)
        except Exception:
            return None

    df["time"] = df.apply(parse_time, axis=1)
    df["weekday"] = df["time"].dt.day_name()
    df["hour"] = df["time"].dt.hour

    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    def classify_game(row):
        day = row["weekday"]
        hour = row["hour"]
        if hour <= 6:
            day = days_order[days_order.index(day) - 1]
            slot = "N"
        elif hour <= 12:
            slot = "M"
        elif hour <= 17:
            slot = "A"
        elif hour <= 20:
            slot = "E"
        else:
            slot = "L"
        return f"{day[:2].upper()}{slot}"

    df["timeslot"] = df.apply(classify_game, axis=1)
    df.drop(columns=["gameday", "gametime", "weekday", "hour"], inplace=True)
    df.to_csv(f"games_{year}.csv", index=False)
    print("updating games complete")


def update_rosters(league_nr: int, year: int):
    print("updating rosters...")
    league = League(league_nr)

    # Aktuelle NFL-Woche abrufen
    current_week = requests.get("https://api.sleeper.app/v1/state/nfl", timeout=5).json().get("week", 17)
    players_count = 8
    data = []

    for week in range(1, current_week):
        weekly_stats = league.get_matchups(week)
        if not weekly_stats:
            continue

        matchup_map = {m["matchup_id"]: p for p, m in enumerate(weekly_stats)}

        for p in range(players_count):
            opp = next((i for i in range(players_count) if i != p and weekly_stats[i]["matchup_id"] == weekly_stats[p]["matchup_id"]), None)
            opp_points = weekly_stats[opp]["points"] if opp is not None else 0

            starters = weekly_stats[p].get("starters", [])
            all_players = weekly_stats[p].get("players", [])
            bench = [pl for pl in all_players if pl not in starters]

            starters_pts = weekly_stats[p].get("starters_points", [])
            players_pts = weekly_stats[p].get("players_points", {})
            bench_pts = [players_pts.get(pl, 0.0) for pl in bench]

            # Team-IDs ersetzen
            mapped_starters = [TEAM_DST_MAPPING.get(pl, pl) for pl in starters]
            mapped_bench = [TEAM_DST_MAPPING.get(pl, pl) for pl in bench]

            # Roster auf 28 Slots auffüllen (12 Starter + 16 Bank)
            player_slots = (mapped_starters + mapped_bench + [None] * 28)[:28]
            point_slots = (starters_pts + bench_pts + [None] * 28)[:28]

            row = [INDEX_TO_MANAGER[p], year, week, weekly_stats[p]["points"], INDEX_TO_MANAGER.get(opp)]
            row.extend(player_slots)
            row.extend(point_slots)
            data.append(row)

    cols = ["manager_id", "year", "week", "points", "opponent_id"] + ROSTER_SLOTS + [f"{c}_points" for c in ROSTER_SLOTS]
    df = pd.DataFrame(data, columns=cols)
    for col in ROSTER_SLOTS:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    df.to_csv(f"rosters_{year}.csv", index=False)
    print("updating rosters complete")


def update_projections(year: int):
  print("updating projections...")
  roster_df = pd.read_csv(f"rosters_{year}.csv")

  # 1. Spalten ins Long-Format bringen
  roster_long = roster_df.melt(
      id_vars=["year", "week"], value_vars=ROSTER_SLOTS, value_name="player_id"
  ).dropna(subset=["player_id"])

  # 2. player_id einheitlich als int -> D/ST rückmappen -> alles als str
  roster_long["player_id"] = roster_long["player_id"].astype(int)
  roster_long["player_id"] = (
      roster_long["player_id"]
      .map(REVERSE_TEAM_DST_MAPPING)
      .fillna(roster_long["player_id"])
      .astype(str)
  )  # <-- WICHTIG: String für einheitlichen Vergleich

  # Roster-Keys als Tupel aus (str, int)
  roster_keys = set(zip(roster_long["player_id"], roster_long["week"]))
  distinct_ids = roster_long["player_id"].unique()

  print(f"Abruf für {len(distinct_ids)} Spieler...")

  session = requests.Session()
  all_rows = []

  for i, player_id in enumerate(distinct_ids, 1):
    url = f"https://api.sleeper.com/projections/nfl/player/{player_id}?season_type=regular&season={year}&grouping=week"
    try:
      resp = session.get(url, timeout=5)
      if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, dict):
          for week, wdata in data.items():
            # week zu int konvertieren und player_id ist sicher str
            if (
                isinstance(wdata, dict)
                and (str(player_id), int(week)) in roster_keys
            ):
              stats = wdata.get("stats", {}) or {}
              all_rows.append({
                  "player_id": str(player_id),
                  "year": year,
                  "week": int(week),
                  "pts_std": stats.get("pts_std"),
                  "pts_half_ppr": stats.get("pts_half_ppr"),
                  "pts_ppr": stats.get("pts_ppr"),
              })
      else:
        print(f"Fehler bei Spieler {player_id} (Status {resp.status_code})")
    except requests.RequestException as e:
      print(f"Netzwerkfehler bei {player_id}: {e}")

    if i % 50 == 0 or i == len(distinct_ids):
      print(f"{i}/{len(distinct_ids)} geladen...")

  df = pd.DataFrame(all_rows)

  if not df.empty:
    # Team-Kürzel wieder zu den 999xx-IDs mappen, reguläre IDs bleiben als Zahl erhalten
    df["player_id"] = (
        df["player_id"]
        .map(TEAM_DST_MAPPING)
        .fillna(df["player_id"])
        .astype(int)
    )
    df.sort_values(by=["week", "player_id"], inplace=True)
    df.to_csv(f"projections_{year}.csv", index=False)
    print(
        f"updating projections complete: {len(df)} Zeilen in"
        f" projections_{year}.csv gespeichert."
    )
  else:
    print("Keine Projections gefunden.")


def update_performances(year: int):
    print("updating performances...")

    # 1. Spieler-Performances laden
    url = f"https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{year}.csv"
    df = pd.read_csv(url)

    cols = [
        "player_id", "player_display_name", "position", "season", "week", "team",
        "opponent_team", "passing_yards", "passing_tds", "passing_interceptions",
        "sack_fumbles_lost", "rushing_fumbles_lost", "receiving_fumbles_lost",
        "passing_2pt_conversions", "rushing_2pt_conversions", "receiving_2pt_conversions",
        "carries", "rushing_yards", "rushing_tds",
        "targets", "receptions", "receiving_yards", "receiving_tds",
        "special_teams_tds", "fg_made", "fg_made_50_59", "fg_made_60_", "pat_made"
    ]
    df = df[cols].copy()

    df = df[(df["position"].isin(VALID_POSITIONS)) & (df["week"] <= 17)].copy()
    df["team"] = df["team"].replace("LA", "LAR")
    df["opponent_team"] = df["opponent_team"].replace("LA", "LAR")

    df["own_team"] = df["team"]
    df["year"] = df["season"]
    df["fumbles"] = df["sack_fumbles_lost"].fillna(0) + df["rushing_fumbles_lost"].fillna(0) + df["receiving_fumbles_lost"].fillna(0)
    df["2pt_conv"] = df["passing_2pt_conversions"].fillna(0) + df["rushing_2pt_conversions"].fillna(0) + df["receiving_2pt_conversions"].fillna(0)
    df["fg_50+"] = df["fg_made_50_59"].fillna(0) + df["fg_made_60_"].fillna(0)

    df.rename(columns={
        "passing_tds": "passing_td",
        "passing_interceptions": "interceptions",
        "rushing_tds": "rushing_td",
        "receiving_tds": "receiving_td",
        "special_teams_tds": "special_teams_td",
        "fg_made": "fg",
        "pat_made": "pat",
    }, inplace=True)

    dst_cols = ["points_allowed", "dst_sacks", "dst_interceptions", "dst_fumbles", "dst_tds", "dst_safeties"]
    for col in dst_cols:
        df[col] = None

    final_cols = [
        "player_id", "player_display_name", "position",
        "year", "week", "own_team", "opponent_team",
        "passing_yards", "passing_td", "interceptions", "fumbles",
        "2pt_conv", "carries", "rushing_yards", "rushing_td",
        "targets", "receptions", "receiving_yards", "receiving_td",
        "special_teams_td", "fg", "fg_50+", "pat",
        "points_allowed", "dst_sacks", "dst_interceptions",
        "dst_fumbles", "dst_tds", "dst_safeties",
    ]
    df = df[final_cols].copy()

    # Sleeper-ID Match
    roster_url = f"https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{year}.csv"
    df_roster = pd.read_csv(roster_url, usecols=["gsis_id", "sleeper_id"])

    df = df.merge(
        df_roster[["gsis_id", "sleeper_id"]].rename(columns={"gsis_id": "player_id"}),
        on="player_id",
        how="left"
    )

    if df["sleeper_id"].isna().any():
        players_file = ensure_players_json()
        with open(players_file, "r", encoding="utf-8") as f:
            player_dict = json.load(f)

        name_map = {v.get("full_name"): int(k) for k, v in player_dict.items() if v.get("full_name")}
        mask = df["sleeper_id"].isna()
        df.loc[mask, "sleeper_id"] = df.loc[mask, "player_display_name"].map(name_map)

    df["player_id"] = pd.to_numeric(df["sleeper_id"], errors="coerce").astype("Int64")
    df.drop(columns=["player_display_name", "position", "sleeper_id"], inplace=True)

    # 2. D/ST verarbeiten
    team_url = f"https://github.com/nflverse/nflverse-data/releases/download/stats_team/stats_team_week_{year}.csv"
    df_team = pd.read_csv(team_url)

    team_cols = [
        "season", "week", "team", "opponent_team",
        "passing_tds", "rushing_tds", "special_teams_tds", "pat_made", "fg_made",
        "passing_2pt_conversions", "rushing_2pt_conversions",
        "def_sacks", "def_interceptions", "fumble_recovery_opp",
        "def_tds", "fumble_recovery_tds", "def_safeties"
    ]
    df_team = df_team[team_cols].copy()
    df_team["team"] = df_team["team"].replace("LA", "LAR")
    df_team["opponent_team"] = df_team["opponent_team"].replace("LA", "LAR")
    df_team.rename(columns={"season": "year"}, inplace=True)

    scored_points = (
        6 * (df_team["passing_tds"].fillna(0) + df_team["rushing_tds"].fillna(0) + df_team["special_teams_tds"].fillna(0))
        + df_team["pat_made"].fillna(0)
        + 3 * df_team["fg_made"].fillna(0)
        + 2 * (df_team["passing_2pt_conversions"].fillna(0) + df_team["rushing_2pt_conversions"].fillna(0))
    )

    points_allowed_lookup = pd.DataFrame({
        "year": df_team["year"],
        "week": df_team["week"],
        "team": df_team["opponent_team"],
        "points_allowed": scored_points
    })
    df_team = df_team.merge(points_allowed_lookup, on=["year", "week", "team"], how="left")

    df_dst = pd.DataFrame({
        "player_id": df_team["team"].map(TEAM_DST_MAPPING).astype("Int64"),
        "year": df_team["year"],
        "week": df_team["week"],
        "own_team": df_team["team"],
        "opponent_team": df_team["opponent_team"],
        "dst_sacks": df_team["def_sacks"],
        "dst_interceptions": df_team["def_interceptions"],
        "dst_fumbles": df_team["fumble_recovery_opp"],
        "dst_tds": (
            df_team["special_teams_tds"].fillna(0)
            + df_team["def_tds"].fillna(0)
            + df_team["fumble_recovery_tds"].fillna(0)
        ),
        "dst_safeties": df_team["def_safeties"],
        "points_allowed": pd.to_numeric(df_team["points_allowed"], errors="coerce").astype("Int64")
    })
    df_dst = df_dst[df_dst["week"] <= 17]
    df_dst = df_dst.reindex(columns=df.columns, fill_value=None)

    # 3. Zusammenführen
    combined = pd.concat([df, df_dst], ignore_index=True)

    # 4. Roster-Filter
    roster_df = pd.read_csv(f"rosters_{year}.csv")
    roster_long = roster_df.melt(
        id_vars=["year", "week"],
        value_vars=ROSTER_SLOTS,
        value_name="player_id"
    ).dropna(subset=["player_id"])
    roster_long["player_id"] = roster_long["player_id"].astype("Int64")

    final_df = combined.merge(
        roster_long[["year", "week", "player_id"]].drop_duplicates(),
        on=["year", "week", "player_id"],
        how="inner"
    )

    # 5. Alle numerischen Spalten & Stats sauber zu Int64 casten
    int_cols = [
        "player_id", "year", "week",
        "passing_yards", "passing_td", "interceptions", "fumbles",
        "2pt_conv", "carries", "rushing_yards", "rushing_td",
        "targets", "receptions", "receiving_yards", "receiving_td",
        "special_teams_td", "fg", "fg_50+", "pat",
        "points_allowed", "dst_sacks", "dst_interceptions",
        "dst_fumbles", "dst_tds", "dst_safeties"
    ]
    for col in int_cols:
        final_df[col] = pd.to_numeric(final_df[col], errors="coerce").astype("Int64")

    final_df.to_csv(f"performances_{year}.csv", index=False)
    print(f"updating performances complete: {len(final_df)} rows")


def main():
    year = 2026
    league_nr = 1380112697919561728

    #draft_nr = 1380112697932148736
    #update_draft(draft_nr)

    update_games(year)
    update_rosters(league_nr, year)
    update_transactions(league_nr, year)
    update_players(year)
    update_projections(year)
    update_performances(year)

    # anschließend: import_upsert
    # edge function für playoff odds

if __name__ == "__main__":
    main()
