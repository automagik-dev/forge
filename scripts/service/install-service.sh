#!/bin/bash
# Main service installer - detects OS and guides user through installation
# Called by: make service

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Automagik Forge - Service Installer${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check OS
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}Error: Cannot detect OS${NC}"
    echo "This script requires /etc/os-release"
    exit 1
fi

source /etc/os-release

# Check if Debian/Ubuntu
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    echo -e "${RED}Error: Unsupported operating system: $PRETTY_NAME${NC}"
    echo ""
    echo "Supported systems:"
    echo "  - Ubuntu 18.04+"
    echo "  - Debian 10+"
    echo ""
    echo "Your system: $PRETTY_NAME"
    echo ""
    echo "For manual systemd setup, see: DEPLOYMENT.md"
    exit 1
fi

echo -e "${GREEN}✓ Detected: $PRETTY_NAME${NC}"
echo ""

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}Error: systemctl not found${NC}"
    echo "This script requires systemd"
    exit 1
fi

echo -e "${GREEN}✓ Systemd detected${NC}"
echo ""

# Check if automagik-forge binary exists
if ! command -v automagik-forge &> /dev/null; then
    echo -e "${RED}Error: automagik-forge not found in PATH${NC}"
    echo ""
    echo "Please install it first:"
    echo "  1. Build production package: ${GREEN}make prod${NC}"
    echo "  2. Install globally: ${GREEN}npm install -g @automagik/forge${NC}"
    echo ""
    echo "Or install from the built package:"
    echo "  ${GREEN}npm install -g ./npx-cli/automagik-forge-*.tgz${NC}"
    exit 1
fi

FORGE_BIN=$(which automagik-forge)
echo -e "${GREEN}✓ Found automagik-forge at: $FORGE_BIN${NC}"
echo ""

# Ask user which installation type they want
echo -e "${BLUE}Installation Options:${NC}"
echo ""
echo -e "1. ${GREEN}Dedicated Service Account${NC} (Recommended for Production)"
echo    "   - Creates 'forge' system user (no login access)"
echo    "   - Maximum security isolation"
echo    "   - Industry best practice"
echo    "   - Requires sudo"
echo ""
echo -e "2. ${YELLOW}Personal User Account${NC} (Quick Setup)"
echo    "   - Uses your current user account ($USER)"
echo    "   - Simpler setup"
echo    "   - Less secure (service has access to your files)"
echo    "   - Requires sudo for systemd installation"
echo ""

read -p "Choose installation type (1 or 2): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        echo -e "${BLUE}Installing with dedicated service account...${NC}"
        echo ""

        # Check if running as root
        if [ "$EUID" -eq 0 ]; then
            "$SCRIPT_DIR/setup.sh"
        else
            sudo "$SCRIPT_DIR/setup.sh"
        fi
        ;;
    2)
        echo -e "${BLUE}Installing with personal user account...${NC}"
        echo ""
        "$SCRIPT_DIR/install.sh"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Service Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo -e "  - Check status: ${GREEN}sudo systemctl status automagik-forge${NC}"
echo -e "  - View logs: ${GREEN}sudo journalctl -u automagik-forge -f${NC}"
echo -e "  - Documentation: ${GREEN}cat DEPLOYMENT.md${NC}"
echo ""
