#!/usr/bin/env python3
"""
Error check / diagnostic script for Hotel Booking project.
Checks Python env, config, database connection, and key paths.
Usage: python error_check.py
"""
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

def section(title):
    print(f"\n{'='*60}\n{title}\n{'='*60}")

def ok(msg):
    print(f"  [OK] {msg}")

def fail(msg):
    print(f"  [FAIL] {msg}")

def main():
    print("Hotel Booking — Error Check (Python)")
    section("1. Python")
    print(f"  Version: {sys.version}")
    ok("Python available")

    section("2. Project paths")
    for name, rel in [
        ("Frontend", "frontend"),
        ("Backend", "backend"),
        ("Database", "database"),
        ("Others/scripts", "others/scripts"),
    ]:
        p = PROJECT_ROOT / rel
        if p.exists():
            ok(f"{name}: {p}")
        else:
            fail(f"{name} missing: {p}")

    section("3. Config / env")
    sys.path.insert(0, str(PROJECT_ROOT / "others" / "scripts"))
    try:
        from config import DB_HOST, DB_PORT, DB_USER, DB_NAME
        ok(f"Config loaded: DB={DB_NAME}, host={DB_HOST}, user={DB_USER}")
    except Exception as e:
        fail(f"Config: {e}")

    section("4. Database connection")
    try:
        from config import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
        n = cur.fetchone()[0]
        ok(f"Connected. Tables in public schema: {n}")
        cur.close()
        conn.close()
    except Exception as e:
        fail(f"Connection: {e}")

    section("5. Backend .env")
    env_file = PROJECT_ROOT / "backend" / ".env"
    if env_file.exists():
        ok(f"backend/.env exists")
    else:
        fail("backend/.env not found (copy from backend/.env.example)")

    print("\nDone.\n")

if __name__ == "__main__":
    main()
