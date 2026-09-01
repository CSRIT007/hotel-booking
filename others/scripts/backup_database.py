#!/usr/bin/env python3
"""
Backup hotel_booking PostgreSQL database to a .sql file.
Usage: python backup_database.py [output.sql]
Or: python backup_database.py  (creates backup with timestamp in filename)
"""
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Add parent so we can import config from project
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from config import DB_HOST, DB_PORT, DB_USER, DB_NAME
except ImportError:
    DB_HOST = os.environ.get("PGHOST", "localhost")
    DB_PORT = os.environ.get("PGPORT", "5432")
    DB_USER = os.environ.get("PGUSER", os.environ.get("USER", "postgres"))
    DB_NAME = os.environ.get("PGDATABASE", "hotel_booking")

DB_PASSWORD = os.environ.get("PGPASSWORD", "")

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None
    if not out:
        out = f"hotel_booking_backup_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.sql"
    out = Path(out)
    env = os.environ.copy()
    if DB_PASSWORD:
        env["PGPASSWORD"] = DB_PASSWORD
    cmd = [
        "pg_dump",
        "-h", DB_HOST,
        "-p", str(DB_PORT),
        "-U", DB_USER,
        "-d", DB_NAME,
        "-f", str(out),
        "--no-password",
    ]
    try:
        subprocess.run(cmd, env=env, check=True)
        print(f"Backup saved: {out}")
    except FileNotFoundError:
        print("pg_dump not found. Install PostgreSQL client or use full path to pg_dump.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Backup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
