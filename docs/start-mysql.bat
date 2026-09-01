@echo off
title MySQL Server
echo Starting MySQL...
echo.
echo Keep this window OPEN while you use phpMyAdmin or the hotel-booking app.
echo Close this window to stop MySQL.
echo.

C:\laragon\bin\mysql\mysql-9.4.0-winx64\bin\mysqld.exe --console

pause
