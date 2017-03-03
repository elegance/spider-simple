@echo off
::  -c :并发数量
::  -s :并发间隔时间，单位秒
::  -i :刷新频率，单位秒
node app.js -c 1 -s 0.5 -i 30