# Systemd Service Installation

Transforms your `make prod` build into a system service for Ubuntu/Debian.

## Supported Systems

- ✅ Ubuntu (18.04+)
- ✅ Debian (10+)
- ❌ Other Linux distributions (not supported at this time)

## Prerequisites

```bash
# 1. Build production package first
make prod

# 2. Verify it works
# (Server should start and be accessible)
```

## Installation

### Quick Install (Recommended for Production)

```bash
# From project root
make service
```

This will:
1. Detect your OS (Ubuntu/Debian required)
2. Ask if you want a dedicated service account (recommended)
3. Install systemd service
4. Enable auto-start on boot
5. Start the service

### Manual Installation

#### Option 1: Dedicated Service Account (Production)

```bash
sudo ./scripts/service/setup.sh
```

Creates:
- System user `forge` (no login access)
- Secure directories (`/opt/automagik-forge`, `/var/lib/automagik-forge`)
- Hardened systemd service
- Auto-start on boot

#### Option 2: Personal User Account (Development)

```bash
./scripts/service/install.sh
```

Uses your current user account to run the service.

## Files

- **`setup.sh`** - Dedicated service account installer (production)
- **`install.sh`** - Personal account installer (development)
- **`automagik-forge.service.template`** - Systemd service template
- **`README.md`** - This file

## After Installation

```bash
# Check service status
sudo systemctl status automagik-forge

# View logs
sudo journalctl -u automagik-forge -f

# Restart service
sudo systemctl restart automagik-forge

# Stop service
sudo systemctl stop automagik-forge

# Disable auto-start
sudo systemctl disable automagik-forge
```

## Security

For production deployments, see:
- [../../SECURITY.md](../../SECURITY.md) - Security best practices
- [../../DEPLOYMENT.md](../../DEPLOYMENT.md) - Full deployment guide

## Troubleshooting

**Service fails to start:**
```bash
# Check logs
sudo journalctl -u automagik-forge -n 50

# Verify binary exists
which automagik-forge

# Test manual start
automagik-forge
```

**Permission issues:**
```bash
# If using service account
sudo chown -R forge:forge /var/lib/automagik-forge
sudo chown -R forge:forge /opt/automagik-forge

# If using personal account
sudo chown -R $USER:$USER ~/.local/share/automagik-forge
```
