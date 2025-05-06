#!/bin/bash

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Check if node-fetch is installed
if npm list | grep -q "node-fetch"; then
  echo "node-fetch is installed"
else
  echo "Installing node-fetch..."
  npm install node-fetch@2
fi

echo "Backend dependencies installation complete!" 