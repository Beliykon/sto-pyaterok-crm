@echo off
title Установка и запуск Сто Пятёрок CRM
echo Первоначальная подготовка и запуск системы...
call npm install
start http://localhost:3000
call npm run dev
