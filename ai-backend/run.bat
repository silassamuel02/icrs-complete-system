@echo off
echo.
echo [COMPLAINT-AI] Starting server with virtual environment...
echo.

:: Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .\venv
    echo [INFO] Please make sure you have created the venv in the project root.
    pause
    exit /b 1
)

:: Install dependencies
echo [INFO] Installing/Updating dependencies from requirements.txt...
.\venv\Scripts\pip.exe install -r requirements.txt

:: Run uvicorn using the venv's python
.\venv\Scripts\python.exe -m uvicorn main:app --reload

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server failed to start.
    pause
)
