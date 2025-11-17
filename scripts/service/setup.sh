#!/bin/bash
# Setup dedicated service account for Automagik Forge
# This creates a locked-down system account specifically for running Forge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Forge Service Account Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    echo "Usage: sudo ./setup.sh"
    exit 1
fi

# Variables
SERVICE_USER="forge"
SERVICE_GROUP="forge"
APP_DIR="/opt/automagik-forge"
DATA_DIR="/var/lib/automagik-forge"
LOG_DIR="/var/log/automagik-forge"
SOURCE_DIR="$PROJECT_ROOT"

echo -e "${BLUE}Configuration:${NC}"
echo "  Service User:  $SERVICE_USER"
echo "  Service Group: $SERVICE_GROUP"
echo "  App Directory: $APP_DIR"
echo "  Data Directory: $DATA_DIR"
echo "  Log Directory: $LOG_DIR"
echo ""

# Ask for confirmation
read -p "Continue with service account creation? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

# Step 1: Create service user and group
echo -e "${YELLOW}Step 1: Creating service user and group...${NC}"
if id "$SERVICE_USER" &>/dev/null; then
    echo -e "${YELLOW}  User '$SERVICE_USER' already exists${NC}"
else
    # Create system user (no login shell, no home directory login)
    useradd --system \
        --shell /usr/sbin/nologin \
        --comment "Automagik Forge Service Account" \
        --user-group \
        "$SERVICE_USER"
    echo -e "${GREEN}  ✓ Created system user: $SERVICE_USER${NC}"
fi

# Step 2: Create directory structure
echo -e "${YELLOW}Step 2: Creating directory structure...${NC}"

# Application directory
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    echo -e "${GREEN}  ✓ Created: $APP_DIR${NC}"
fi

# Data directory (database, worktrees, etc.)
if [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR"
    echo -e "${GREEN}  ✓ Created: $DATA_DIR${NC}"
fi

# Log directory
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo -e "${GREEN}  ✓ Created: $LOG_DIR${NC}"
fi

# Step 3: Copy application files
echo -e "${YELLOW}Step 3: Copying application files...${NC}"
if [ -d "$SOURCE_DIR" ]; then
    # Copy only necessary files
    cp -r "$SOURCE_DIR/.env" "$APP_DIR/" 2>/dev/null || echo "  .env not found (will need to create)"
    cp "$SOURCE_DIR/automagik-forge.service" "$APP_DIR/" 2>/dev/null || true

    echo -e "${GREEN}  ✓ Application files copied${NC}"
else
    echo -e "${RED}  Error: Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Step 4: Set ownership and permissions
echo -e "${YELLOW}Step 4: Setting ownership and permissions...${NC}"

# App directory - read-only for service user
chown -R root:$SERVICE_GROUP "$APP_DIR"
chmod 750 "$APP_DIR"
chmod 640 "$APP_DIR/.env" 2>/dev/null || true

# Data directory - read/write for service user
chown -R $SERVICE_USER:$SERVICE_GROUP "$DATA_DIR"
chmod 750 "$DATA_DIR"

# Log directory - write access for service user
chown -R $SERVICE_USER:$SERVICE_GROUP "$LOG_DIR"
chmod 750 "$LOG_DIR"

echo -e "${GREEN}  ✓ Permissions set${NC}"

# Step 5: Install node/npm for service user (via nvm or system package)
echo -e "${YELLOW}Step 5: Checking Node.js installation...${NC}"

# Check if automagik-forge binary is globally available
if command -v automagik-forge &> /dev/null; then
    FORGE_BIN=$(which automagik-forge)
    echo -e "${GREEN}  ✓ Found automagik-forge at: $FORGE_BIN${NC}"
else
    echo -e "${RED}  Error: automagik-forge not found in PATH${NC}"
    echo -e "${YELLOW}  Install it first: npm install -g @automagik/forge${NC}"
    exit 1
fi

# Step 6: Create systemd service with proper user
echo -e "${YELLOW}Step 6: Creating systemd service...${NC}"

cat > /etc/systemd/system/automagik-forge.service << EOF
[Unit]
Description=Automagik Forge - Vibe Coding++ Platform
Documentation=https://github.com/namastexlabs/automagik-forge
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$APP_DIR

# Environment
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$APP_DIR/.env

# Start forge
ExecStart=$FORGE_BIN

# Restart configuration
Restart=always
RestartSec=10
StartLimitInterval=300
StartLimitBurst=5

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR
ReadWritePaths=$LOG_DIR

# Resource limits
LimitNOFILE=65536
TasksMax=4096

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=automagik-forge

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}  ✓ Systemd service created${NC}"

# Step 7: Create .env if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Step 7: Creating default .env file...${NC}"
    cat > "$APP_DIR/.env" << EOF
# Automagik Forge Production Configuration

# Server Configuration
HOST=0.0.0.0
BACKEND_PORT=8887
PUBLIC_BASE_URL=https://forge-cloud.namastex.ai
DISABLE_BROWSER_OPEN=true
RUST_LOG=info

# Database (stored in $DATA_DIR)
DATABASE_URL=sqlite:$DATA_DIR/forge.db
EOF
    chown root:$SERVICE_GROUP "$APP_DIR/.env"
    chmod 640 "$APP_DIR/.env"
    echo -e "${GREEN}  ✓ Default .env created${NC}"
    echo -e "${YELLOW}  → Review and edit: $APP_DIR/.env${NC}"
fi

# Step 8: Enable and start service
echo -e "${YELLOW}Step 8: Enabling systemd service...${NC}"
systemctl daemon-reload
systemctl enable automagik-forge
echo -e "${GREEN}  ✓ Service enabled (will start on boot)${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Service Account Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Security Summary:${NC}"
echo "  • Service runs as: $SERVICE_USER (system account, no login)"
echo "  • Application dir: $APP_DIR (read-only)"
echo "  • Data directory: $DATA_DIR (read/write for service only)"
echo "  • Logs directory: $LOG_DIR (write for service only)"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review configuration: sudo nano $APP_DIR/.env"
echo "  2. Start service: sudo systemctl start automagik-forge"
echo "  3. Check status: sudo systemctl status automagik-forge"
echo "  4. View logs: sudo journalctl -u automagik-forge -f"
echo ""
echo -e "${BLUE}Service Management:${NC}"
echo "  sudo systemctl start automagik-forge   # Start"
echo "  sudo systemctl stop automagik-forge    # Stop"
echo "  sudo systemctl restart automagik-forge # Restart"
echo "  sudo systemctl status automagik-forge  # Status"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  • The 'forge' user has NO login access (secure by design)"
echo "  • Application files are read-only for the service"
echo "  • Only data directory has write access"
echo "  • Logs go to systemd journal (journalctl)"
echo ""
