#!/bin/bash

# Navigate to the project directory
cd "$(realpath "$(dirname "$0")/../strategic-mythology")"

# Check if the server is already running
if pgrep -f "node server.js" > /dev/null
then
    echo "Server is already running."
else
    echo "Starting the server..."
    node server.js &
fi
