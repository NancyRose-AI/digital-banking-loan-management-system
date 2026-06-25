@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   DigiBank Enterprise Portal -- Dev Mode
echo ============================================
echo.

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

REM -------------------------------------------------------
REM  Check / generate Maven Wrapper inside backend\
REM -------------------------------------------------------
if not exist "%BACKEND_DIR%\mvnw.cmd" (
    echo [backend] Maven Wrapper not found. Generating...
    if exist "%BACKEND_DIR%\maven\apache-maven-3.9.6\bin\mvn.cmd" (
        pushd "%BACKEND_DIR%"
        call maven\apache-maven-3.9.6\bin\mvn.cmd wrapper:wrapper
        popd
    ) else (
        echo [backend] ERROR: Bundled Maven not found.
        echo           Install Maven and run: mvn -f backend/pom.xml wrapper:wrapper
        pause
        exit /b 1
    )
)

REM -------------------------------------------------------
REM  Start Backend (Spring Boot)
REM -------------------------------------------------------
echo [backend] Starting Spring Boot server...
start "DigiBank-Backend" cmd /k "cd /d "%BACKEND_DIR%" && mvnw.cmd spring-boot:run"

REM -------------------------------------------------------
REM  Start Frontend (React/Vite)
REM -------------------------------------------------------
echo [frontend] Starting Vite dev server...
start "DigiBank-Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo Both servers are launching in separate windows.
echo   Backend  --^> http://localhost:8080
echo   Frontend --^> https://localhost:3000
echo.
echo Close each window (or press Ctrl+C inside it) to stop a server.
pause
