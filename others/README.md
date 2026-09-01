# Others

- **MIGRATION.md** — Map of every former PHP file to its replacement (Vue routes, backend API, or Python script). All PHP has been removed.
- **scripts/** — Python utility scripts (config, backup, diagnostics). Use these for DB config, backup, and error-check.

## Python scripts

From project root:

```bash
cd others/scripts
pip install -r requirements.txt
python error_check.py    # Check paths, config, DB connection
python backup_database.py [output.sql]   # Backup PostgreSQL (requires pg_dump)
```

Scripts use the same DB settings as the backend (see `backend/.env`: PGHOST, PGPORT, PGUSER, PGDATABASE).
