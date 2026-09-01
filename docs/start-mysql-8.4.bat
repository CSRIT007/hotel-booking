@echo off
title MySQL 8.4 Server
echo Starting MySQL 8.4.3...
echo.
echo Keep this window OPEN while you use phpMyAdmin or the hotel-booking app.
echo Use this if MySQL 9.4 fails with redo log error.
echo.

C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe --console

pause
