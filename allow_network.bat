@echo off
echo ==========================================
echo opening windows firewall for syntronics...
echo ==========================================

echo Requesting Administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: This script must be run as Administrator.
    echo Please right-click 'allow_network.bat' and select "Run as administrator".
    pause
    exit /b 1
)

echo.
echo Opening Port 5174 (Frontend Web App)...
netsh advfirewall firewall add rule name="SYNTRONICS Frontend (5174)" dir=in action=allow protocol=TCP localport=5174

echo.
echo Opening Port 5005 (Backend API/WebSocket)...
netsh advfirewall firewall add rule name="SYNTRONICS Backend (5005)" dir=in action=allow protocol=TCP localport=5005

echo.
echo ==========================================
echo SUCCESS! Your smartphone should now connect.
echo Try loading http://192.168.8.114:5174 again.
echo ==========================================
pause
