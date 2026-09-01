@echo off
title Fix MySQL - restore redo folder and clear bad logs
echo.
echo This fixes: "Neither found #innodb_redo subdirectory, nor ib_logfile*"
echo (After you already ran the first fix and renamed #innodb_redo.)
echo.
echo Make sure MySQL is NOT running.
echo We will: 1) Restore the folder  2) Clear only the log files inside  3) You start MySQL
echo.

set "DATADIR=C:\laragon\data\mysql-9.4"
cd /d "%DATADIR%"

if not exist "innodb_redo_backup" (
    echo ERROR: Folder innodb_redo_backup not found.
    echo If you never ran the first fix, run fix-mysql-redo-log.bat instead.
    goto :eof
)

echo Step 1: Renaming innodb_redo_backup back to #innodb_redo...
ren "innodb_redo_backup" "#innodb_redo"
if not exist "#innodb_redo" (
    echo Rename failed. Manually rename folder innodb_redo_backup to #innodb_redo in:
    echo %DATADIR%
    goto :eof
)
echo Done.

echo.
echo Step 2: Removing old redo log files inside #innodb_redo (MySQL will create new ones)...
cd "#innodb_redo"
for %%f in (*) do del "%%f" 2>nul
cd ..
echo Done.

echo.
echo Step 3: Run start-mysql.bat and keep that window open.
echo.
pause
