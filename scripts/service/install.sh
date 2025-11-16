#!/bin/bash
# Install Automagik Forge systemd service
# This script installs and enables the systemd service for automatic startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Automagik Forge Systemd Service Installer${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Do not run this script as root!${NC}"
    echo -e "${YELLOW}Run as your user, the script will prompt for sudo when needed.${NC}"
    exit 1
fi

# Check if service template exists
SERVICE_TEMPLATE="$SCRIPT_DIR/automagik-forge.service.template"
if [ ! -f "$SERVICE_TEMPLATE" ]; then
    echo -e "${RED}Error: Service template not found at: $SERVICE_TEMPLATE${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found at: $PROJECT_ROOT/.env${NC}"
    echo -e "${YELLOW}Consider copying .env.example to .env and configuring it${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verify systemd is available
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}Error: systemctl not found${NC}"
    echo "This script requires systemd"
    exit 1
fi

# Generate service file from template
echo -e "${YELLOW}Generating service file...${NC}"
CURRENT_USER="$USER"
CURRENT_GROUP="$(id -gn)"
CURRENT_DIR="$PROJECT_ROOT"
FORGE_BIN="$(which automagik-forge)"
NODE_BIN_DIR="$(dirname "$FORGE_BIN")"

# Create temporary service file
TMP_SERVICE="/tmp/automagik-forge-$$.service"
sed -e "s|User=namastex|User=$CURRENT_USER|g" \
    -e "s|Group=namastex|Group=$CURRENT_GROUP|g" \
    -e "s|WorkingDirectory=/home/namastex/prod/automagik-forge|WorkingDirectory=$CURRENT_DIR|g" \
    -e "s|Environment=\"PATH=/home/namastex/.nvm/versions/node/v22.21.1/bin:|Environment=\"PATH=$NODE_BIN_DIR:|g" \
    -e "s|EnvironmentFile=/home/namastex/prod/automagik-forge/.env|EnvironmentFile=$CURRENT_DIR/.env|g" \
    -e "s|ExecStart=/home/namastex/.nvm/versions/node/v22.21.1/bin/automagik-forge|ExecStart=$FORGE_BIN|g" \
    -e "s|ReadWritePaths=/home/namastex/.local/share/automagik-forge|ReadWritePaths=$HOME/.local/share/automagik-forge|g" \
    -e "s|ReadWritePaths=/home/namastex/prod/automagik-forge|ReadWritePaths=$CURRENT_DIR|g" \
    "$SERVICE_TEMPLATE" > "$TMP_SERVICE"

# Copy service file
echo -e "${YELLOW}Installing service file...${NC}"
sudo cp "$TMP_SERVICE" /etc/systemd/system/automagik-forge.service
rm "$TMP_SERVICE"
echo -e "${GREEN}✓ Service file copied to /etc/systemd/system/${NC}"

# Reload systemd daemon
echo -e "${YELLOW}Reloading systemd daemon...${NC}"
sudo systemctl daemon-reload
echo -e "${GREEN}✓ Systemd daemon reloaded${NC}"

# Enable service
echo -e "${YELLOW}Enabling service (auto-start on boot)...${NC}"
sudo systemctl enable automagik-forge
echo -e "${GREEN}✓ Service enabled${NC}"

# Ask if user wants to start now
echo ""
read -p "Start the service now? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}Service installed but not started${NC}"
    echo -e "Start it manually with: ${GREEN}sudo systemctl start automagik-forge${NC}"
else
    echo -e "${YELLOW}Starting service...${NC}"
    sudo systemctl start automagik-forge
    sleep 2

    # Check status
    if sudo systemctl is-active --quiet automagik-forge; then
        echo -e "${GREEN}✓ Service started successfully${NC}"
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}Installation Complete!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo "Useful commands:"
        echo -e "  ${GREEN}sudo systemctl status automagik-forge${NC}  - Check service status"
        echo -e "  ${GREEN}sudo journalctl -u automagik-forge -f${NC}  - View logs (follow mode)"
        echo -e "  ${GREEN}sudo systemctl restart automagik-forge${NC} - Restart service"
        echo -e "  ${GREEN}sudo systemctl stop automagik-forge${NC}    - Stop service"
        echo ""
        echo "Access Forge at: http://localhost:8887 (or your configured URL)"
    else
        echo -e "${RED}✗ Service failed to start${NC}"
        echo -e "Check logs with: ${YELLOW}sudo journalctl -u automagik-forge -n 50${NC}"
        exit 1
    fi
fi

echo ""
echo -e "For more information, see: ${GREEN}DEPLOYMENT.md${NC}"
