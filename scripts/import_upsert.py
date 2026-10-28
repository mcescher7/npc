import os
from pathlib import Path
import sys

# Optional: Lädt Umgebungsvariablen aus einer lokalen .env-Datei (falls python-dotenv installiert ist)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import psycopg
from psycopg import sql

# Datenbankverbindung aus Umgebungsvariablen lesen
# Unterstützt 'DATABASE_URL' oder 'DB_CONNECTION_STRING'
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("DB_CONNECTION_STRING")

if not DATABASE_URL:
    print(
        "FEHLER: Keine Datenbankverbindung konfiguriert!\n"
        "Bitte setze die Umgebungsvariable 'DATABASE_URL' bzw. 'DB_CONNECTION_STRING' "
        "(lokal in einer .env-Datei oder in GitHub Repository Secrets).",
        file=sys.stderr
    )
    sys.exit(1)

# CSV-Dateien liegen standardmäßig im selben Ordner wie dieses Skript.
CSV_ORDNER = Path(__file__).resolve().parent

IMPORTS = {
    "players": {
        "csv": CSV_ORDNER / "players_2026.csv",
        "ziel": "players",
        "temp": "temp_players",
        "konflikt": ["player_id"],
        "spalten": [
            "player_id",
            "first_name",
            "last_name",
            "position",
            "team",
            "birth_date",
            "number",
            "rookie_year",
            "height",
            "weight",
            "college",
        ],
    },
    "rosters": {
        "csv": CSV_ORDNER / "rosters_2026.csv",
        "ziel": "rosters",
        "temp": "temp_rosters",
        "konflikt": ["manager_id", "year", "week"],
        "spalten": [
            "manager_id",
            "year",
            "week",
            "points",
            "opponent_id",
            "qb1",
            "qb2",
            "rb1",
            "rb2",
            "wr1",
            "wr2",
            "wr3",
            "te",
            "flex1",
            "flex2",
            "k",
            "d/st",
            "bn1",
            "bn2",
            "bn3",
            "bn4",
            "bn5",
            "bn6",
            "bn7",
            "bn8",
            "bn9",
            "bn10",
            "bn11",
            "bn12",
            "bn13",
            "bn14",
            "bn15",
            "bn16",
            "qb1_points",
            "qb2_points",
            "rb1_points",
            "rb2_points",
            "wr1_points",
            "wr2_points",
            "wr3_points",
            "te_points",
            "flex1_points",
            "flex2_points",
            "k_points",
            "d/st_points",
            "bn1_points",
            "bn2_points",
            "bn3_points",
            "bn4_points",
            "bn5_points",
            "bn6_points",
            "bn7_points",
            "bn8_points",
            "bn9_points",
            "bn10_points",
            "bn11_points",
            "bn12_points",
            "bn13_points",
            "bn14_points",
            "bn15_points",
            "bn16_points",
        ],
    },
    "transactions": {
        "csv": CSV_ORDNER / "transactions_2026.csv",
        "ziel": "transactions",
        "temp": "temp_transactions",
        "konflikt": ["time", "manager_id", "player_id"],
        "spalten": [
            "time",
            "week",
            "manager_id",
            "player_id",
            "info",
            "type",
            "target",
        ],
    },
    "projections": {
        "csv": CSV_ORDNER / "projections_2026.csv",
        "ziel": "projections",
        "temp": "temp_projections",
        "konflikt": ["player_id", "year", "week"],
        "spalten": [
            "player_id",
            "year",
            "week",
            "pts_std",
            "pts_half_ppr",
            "pts_ppr",
        ],
    },
    "performances": {
        "csv": CSV_ORDNER / "performances_2026.csv",
        "ziel": "performances",
        "temp": "temp_performances",
        "konflikt": ["player_id", "year", "week"],
        "spalten": [
            "player_id", "year", "week", "own_team", "opponent_team",
            "passing_yards", "passing_td", "interceptions", "fumbles", "2pt_conv",
            "carries", "rushing_yards", "rushing_td",
            "targets", "receptions", "receiving_yards", "receiving_td",
            "special_teams_td",
            "fg", "fg_50+", "pat",
            "points_allowed", "dst_sacks", "dst_interceptions", "dst_fumbles", "dst_tds", "dst_safeties",
        ],
    },
}

MATERIALIZED_VIEWS = [
    "fantasy_points_view",
    "manager_stats",
    "roster_info",
    "v_scores",
    "totw"
]


def identifiers(spalten):
    return sql.SQL(", ").join(sql.Identifier(spalte) for spalte in spalten)


def pruefe_import(name, config):
    fehlende_konfliktspalten = [
        spalte
        for spalte in config["konflikt"]
        if spalte not in config["spalten"]
    ]

    if fehlende_konfliktspalten:
        raise ValueError(
            f"{name}: Konfliktspalten fehlen in 'spalten': "
            f"{', '.join(fehlende_konfliktspalten)}"
        )

    if not config["csv"].is_file():
        raise FileNotFoundError(
            f"{name}: CSV-Datei nicht gefunden: {config['csv']}"
        )


def importiere_tabelle(cur, name, config):
    pruefe_import(name, config)

    csv_datei = config["csv"]
    zieltabelle = config["ziel"]
    temp_tabelle = config["temp"]
    spalten = config["spalten"]
    konfliktspalten = config["konflikt"]

    insert_spalten_sql = identifiers(spalten)
    konfliktspalten_sql = identifiers(konfliktspalten)

    update_spalten = [
        spalte
        for spalte in spalten
        if spalte not in konfliktspalten
    ]

    update_sql = sql.SQL(",\n            ").join(
        sql.SQL("{} = EXCLUDED.{}").format(
            sql.Identifier(spalte),
            sql.Identifier(spalte),
        )
        for spalte in update_spalten
    )

    cur.execute(
        sql.SQL("""
            CREATE TEMPORARY TABLE {} (
                LIKE public.{} INCLUDING ALL
            ) ON COMMIT DROP
        """).format(
            sql.Identifier(temp_tabelle),
            sql.Identifier(zieltabelle),
        )
    )

    copy_sql = sql.SQL("""
        COPY {} ({})
        FROM STDIN
        WITH (
            FORMAT CSV,
            HEADER TRUE,
            DELIMITER ',',
            NULL ''
        )
    """).format(
        sql.Identifier(temp_tabelle),
        insert_spalten_sql,
    )

    with open(csv_datei, "rb") as datei:
        with cur.copy(copy_sql) as copy:
            while daten := datei.read(1024 * 1024):
                copy.write(daten)

    cur.execute(
        sql.SQL("SELECT COUNT(*) FROM {}").format(
            sql.Identifier(temp_tabelle)
        )
    )
    csv_zeilen = cur.fetchone()[0]
    print(f"[{name}] {csv_zeilen} CSV-Zeilen importiert.")

    upsert_sql = sql.SQL("""
        INSERT INTO public.{} ({})
        SELECT {}
        FROM {}
        ON CONFLICT ({}) DO UPDATE
        SET
            {}
    """).format(
        sql.Identifier(zieltabelle),
        insert_spalten_sql,
        insert_spalten_sql,
        sql.Identifier(temp_tabelle),
        konfliktspalten_sql,
        update_sql,
    )

    cur.execute(upsert_sql)
    print(f"[{name}] {cur.rowcount} Zeilen eingefuegt oder aktualisiert.")

    cur.execute(
        sql.SQL("DROP TABLE {}").format(
            sql.Identifier(temp_tabelle)
        )
    )


def main():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:

            # 1. CSV-Imports und UPSERTs
            for name, config in IMPORTS.items():
                print(f"Starte Import: {name}")
                importiere_tabelle(cur, name, config)

            # 2. Abhängige Materialized Views neu berechnen
            for view_name in MATERIALIZED_VIEWS:
                print(f"Aktualisiere Materialized View: {view_name}")

                cur.execute(
                    sql.SQL("""
                        REFRESH MATERIALIZED VIEW public.{}
                    """).format(
                        sql.Identifier(view_name)
                    )
                )

        # Erst wenn jeder Import und jeder Refresh erfolgreich war:
        conn.commit()

    print("Alle Imports und Materialized Views wurden erfolgreich abgeschlossen.")


if __name__ == "__main__":
    main()
