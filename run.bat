@echo off
echo Checking audio files...
if not exist "public\audio" mkdir "public\audio"
python -m pip install -r requirements.txt
python app.py 