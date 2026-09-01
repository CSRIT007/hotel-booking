@echo off
title Fix MySQL redo log error
echo.
echo This fixes: "redo log file comes from other data directory"
echo Make sure MySQL is NOT running (close the start-mysql window first).
echo.
echo YOUR DATABASE IS SAFE: We only rename the redo LOG folder (#innodb_redo).
echo Your real data (hotel_booking, etc.) is in other files - we do NOT touch them.
echo.

set "DATADIR=C:\laragon\data\mysql-9.4"

if not exist "%DATADIR%" (
    echo ERROR: Data folder not found. Is Laragon in C:\laragon?
    pause
    exit /b 1
)

cd /d "%DATADIR%"
if exist "#innodb_redo" (
    echo Renaming corrupted redo log folder...
    ren "#innodb_redo" "innodb_redo_backup"
    if exist "innodb_redo_backup" (
        echo Done. Old redo logs renamed to innodb_redo_backup.
        echo.
        echo Now run start-mysql.bat again.
    ) else (
        echo Rename failed. Try manually:
        echo 1. Open C:\laragon\data\mysql-9.4\
        echo 2. Rename folder #innodb_redo to innodb_redo_old
    )
) else (
    echo Folder #innodb_redo not found. MySQL may already have recreated it.
    echo Try running start-mysql.bat.
)

echo.
pause
