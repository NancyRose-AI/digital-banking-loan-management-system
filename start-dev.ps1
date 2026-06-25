# ============================================================
#  DigiBank – Start Development Servers
#  Launches backend (Spring Boot) and frontend (React/Vite)
#  in separate windows with no external dependencies.
# ============================================================

Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host "  DigiBank Enterprise Portal – Dev Mode" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor DarkCyan

# ----------------------------------------------------------
# Check Maven Wrapper exists inside backend/
# ----------------------------------------------------------
$backendRoot = Join-Path $PSScriptRoot "backend"
$frontendRoot = Join-Path $PSScriptRoot "frontend"
$mvnwCmd     = Join-Path $backendRoot "mvnw.cmd"
$localMvn    = Join-Path $backendRoot "maven\apache-maven-3.9.6\bin\mvn.cmd"

if (!(Test-Path $mvnwCmd)) {
    Write-Host "[backend] Maven Wrapper not found – generating..." -ForegroundColor Yellow
    if (Test-Path $localMvn) {
        Push-Location $backendRoot
        & $localMvn wrapper:wrapper
        Pop-Location
    } else {
        Write-Host "[backend] ERROR: Bundled Maven not found at $localMvn" -ForegroundColor Red
        Write-Host "           Install Maven and run: mvn -f backend/pom.xml wrapper:wrapper" -ForegroundColor Red
        exit 1
    }
}

# ----------------------------------------------------------
# Start Backend (Spring Boot via Maven Wrapper)
# ----------------------------------------------------------
Write-Host ""
Write-Host "[backend] Starting Spring Boot server..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k title DigiBank-Backend && cd /d `"$backendRoot`" && mvnw.cmd spring-boot:run"

# ----------------------------------------------------------
# Start Frontend (React / Vite)
# ----------------------------------------------------------
Write-Host "[frontend] Starting Vite dev server..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k title DigiBank-Frontend && cd /d `"$frontendRoot`" && npm run dev"

Write-Host ""
Write-Host "Both servers are launching in separate windows." -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Frontend -> https://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close each window (or press Ctrl+C inside it) to stop a server." -ForegroundColor DarkGray
