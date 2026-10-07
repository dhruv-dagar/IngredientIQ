@echo off
echo ==============================================
echo   IngredientIQ Game Launcher
echo ==============================================
echo.

set NODE_DIR=%~dp0.bin\node-v20.11.1-win-x64
set PATH=%NODE_DIR%;%PATH%
set NODE_EXEC="%NODE_DIR%\node.exe"
set NPM_EXEC="%NODE_DIR%\npm.cmd"

echo [1/4] Installing backend dependencies...
cd "%~dp0\server"
call %NPM_EXEC% install

echo [2/4] Installing frontend dependencies...
cd "%~dp0\client"
call %NPM_EXEC% install

echo [3/4] Starting backend server in a new window...
cd "%~dp0\server"
start "IngredientIQ Backend" cmd /k "call %NPM_EXEC% run dev"

echo [4/4] Starting frontend client in a new window...
cd "%~dp0\client"
start "IngredientIQ Frontend" cmd /k "call %NPM_EXEC% run dev"

echo.
echo ==============================================
echo   Game is starting up! 
echo   Check the two new terminal windows.
echo   The frontend usually runs at http://localhost:5173
echo ==============================================
pause
