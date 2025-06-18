# SkillSpring Launchpad Startup Script

# Function to check if a command exists
function Test-Command {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) { return $true }
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $oldPreference
    }
}

# Create data directory for backend
if (-not (Test-Path -Path ".\backend\data")) {
    New-Item -Path ".\backend\data" -ItemType Directory
    Write-Host "Created data directory for backend"
}

# Start backend server
Write-Host "Starting backend server..."
Start-Process -FilePath "powershell" -ArgumentList "-Command cd .\backend; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt; python run.py" -NoNewWindow

# Wait for backend to start
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "Starting frontend server..."
Start-Process -FilePath "powershell" -ArgumentList "-Command cd .\frontend; npm install; npm run dev" -NoNewWindow

Write-Host "SkillSpring Launchpad is running!"
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Press Ctrl+C to stop all servers"

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # This block will execute when Ctrl+C is pressed
    Write-Host "Shutting down servers..."
    # You might want to add cleanup code here
}