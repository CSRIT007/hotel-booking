@echo off
REM Backup hotel_booking database before MySQL/Laragon updates.
REM Run this manually or schedule with Windows Task Scheduler.
REM Edit MYSQL_BIN and BACKUP_DIR if your paths differ.

setlocal

REM Laragon MySQL 9.4 (change if you use another version, e.g. mysql-8.4.3-winx64)
set MYSQL_BIN=C:\laragon\bin\mysql\mysql-9.4.0-winx64\bin
set BACKUP_DIR=C:\DB_BACKUPS
set DB_NAME=hotel_booking
REM Use app user so script runs without password prompt (or use root and set MYSQL_PWD)
set DB_USER=hotel_app
set DB_PASS=hotel_app_pass

REM Date for filename (YYYYMMDD)
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format 'yyyyMMdd'"') do set BACKUPDATE=%%i
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%BACKUPDATE%.sql

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Backing up %DB_NAME% to %BACKUP_FILE% ...
"%MYSQL_BIN%\mysqldump.exe" -u %DB_USER% -p%DB_PASS% --single-transaction --routines --triggers %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo Backup OK: %BACKUP_FILE%
) else (
    echo Backup FAILED. Check user/password and that MySQL is running.
    exit /b 1
)

endlocal
