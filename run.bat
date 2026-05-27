@echo off
REM Activate the virtual environment and run the Flask app.
call "%~dp0venv\Scripts\activate.bat"
python "%~dp0app.py"
