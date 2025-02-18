# Navigate to the project directory
Set-Location -Path (Join-Path -Path $PSScriptRoot -ChildPath "..\strategic-mythology")

# Check if the server is already running
if (Get-Process -Name "node" -ErrorAction SilentlyContinue) {
    Write-Output "Server is already running."
} else {
    Write-Output "Starting the server..."
    Start-Process "node" -ArgumentList "server.js"
}

# If you have any additional commands to start your game, add them below
# Example for an npm script:
npm start
