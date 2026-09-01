"""
Database and app configuration for Hotel Booking.
Use with PostgreSQL (same as backend). Load from .env or set in environment.
"""
import os
from pathlib import Path

# Load .env from project root or backend if present
def _load_dotenv():
    try:
        from dotenv import load_dotenv
        root = Path(__file__).resolve().parents[2]  # project root
        load_dotenv(root / ".env")
        load_dotenv(root / "backend" / ".env")
    except ImportError:
        pass

_load_dotenv()

# PostgreSQL (match backend api-server)
DB_HOST = os.environ.get("PGHOST", "localhost")
DB_PORT = int(os.environ.get("PGPORT", "5432"))
DB_USER = os.environ.get("PGUSER", os.environ.get("USER", "postgres"))
DB_PASSWORD = os.environ.get("PGPASSWORD", "")
DB_NAME = os.environ.get("PGDATABASE", "hotel_booking")

def get_db_connection():
    """Return a psycopg2 connection to the database."""
    try:
        import psycopg2
        return psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD or None,
            dbname=DB_NAME,
        )
    except ImportError:
        raise RuntimeError("Install psycopg2: pip install psycopg2-binary")
