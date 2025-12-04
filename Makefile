.PHONY: help dev dev-core dev-core-off ensure-cargo-config prod backend frontend ensure-frontend-stub build-frontend build test clean publish beta version npm check-cargo check-android-deps publish-automagik publish-automagik-quick service install update uninstall install-deps install-complete install-complete-no-pm2 setup-pm2 start-local stop-local restart-local service-status logs logs-follow health

# Ensure bash is used for echo -e support
SHELL := /bin/bash

# ===========================================
# 📋 Service Configuration
# ===========================================
SERVICE_NAME := 8887: Forge
SERVICE_PORT := 8887
HEALTH_ENDPOINT := http://localhost:$(SERVICE_PORT)/health
PM2_CONFIG := ecosystem.config.cjs

# ===========================================
# 🎨 Colors & Symbols
# ===========================================
FONT_RED := $(shell tput setaf 1)
FONT_GREEN := $(shell tput setaf 2)
FONT_YELLOW := $(shell tput setaf 3)
FONT_BLUE := $(shell tput setaf 4)
FONT_PURPLE := $(shell tput setaf 5)
FONT_CYAN := $(shell tput setaf 6)
FONT_GRAY := $(shell tput setaf 7)
FONT_BOLD := $(shell tput bold)
FONT_RESET := $(shell tput sgr0)
CHECKMARK := ✅
WARNING := ⚠️
ERROR := ❌
ROCKET := 🚀
HAMMER := 🔨
INFO := ℹ️
SPARKLES := ✨

# ===========================================
# 🛠️ Utility Functions
# ===========================================
define print_status
	@echo -e "$(FONT_PURPLE)$(HAMMER) $(1)$(FONT_RESET)"
endef

define print_success
	@echo -e "$(FONT_GREEN)$(CHECKMARK) $(1)$(FONT_RESET)"
endef

define print_warning
	@echo -e "$(FONT_YELLOW)$(WARNING) $(1)$(FONT_RESET)"
endef

define print_error
	@echo -e "$(FONT_RED)$(ERROR) $(1)$(FONT_RESET)"
endef

define print_info
	@echo -e "$(FONT_CYAN)$(INFO) $(1)$(FONT_RESET)"
endef

define check_pm2
	@if ! command -v pm2 >/dev/null 2>&1; then \
		echo -e "$(FONT_RED)$(ERROR) PM2 not found$(FONT_RESET)"; \
		echo -e "$(FONT_YELLOW)💡 Install with: npm install -g pm2$(FONT_RESET)"; \
		exit 1; \
	fi
endef

define check_systemd
	@if [[ "$$(uname -s)" != "Linux" ]]; then \
		echo -e "$(FONT_CYAN)$(INFO) systemd only available on Linux$(FONT_RESET)"; \
		exit 1; \
	fi; \
	if ! command -v systemctl >/dev/null 2>&1; then \
		echo -e "$(FONT_YELLOW)$(WARNING) systemd not found$(FONT_RESET)"; \
		exit 1; \
	fi
endef

define ensure_env_file
	@if [ ! -f ".env" ]; then \
		if [ -f ".env.example" ]; then \
			echo -e "$(FONT_YELLOW)$(WARNING) .env not found - creating from .env.example$(FONT_RESET)"; \
			cp .env.example .env; \
			echo -e "$(FONT_CYAN)$(INFO) .env created - please configure before starting$(FONT_RESET)"; \
		else \
			echo -e "$(FONT_YELLOW)$(WARNING) .env not found and no .env.example$(FONT_RESET)"; \
		fi; \
	fi
endef

# ===========================================
# 📋 Help System
# ===========================================
.PHONY: help
help: ## 🔨 Show this help message
	@echo ""
	@echo -e "$(FONT_BOLD)$(FONT_PURPLE)🔨 Automagik Forge$(FONT_RESET) - $(FONT_GRAY)The Vibe Coding++ Platform$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_YELLOW)🏢 Building the future of autonomous software development$(FONT_RESET)"
	@echo -e "$(FONT_CYAN)📦 GitHub:$(FONT_RESET) https://github.com/namastexlabs/automagik-forge"
	@echo ""
	@echo -e "$(FONT_CYAN)$(ROCKET) Installation & Setup:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)install$(FONT_RESET)         Full interactive installation (6 phases)"
	@echo -e "  $(FONT_PURPLE)install-deps$(FONT_RESET)    Install dependencies only (no PM2/systemd)"
	@echo -e "  $(FONT_PURPLE)update$(FONT_RESET)          Update installation (git pull + deps + restart + health)"
	@echo -e "  $(FONT_PURPLE)uninstall$(FONT_RESET)       Remove PM2/systemd services and clean builds"
	@echo ""
	@echo -e "$(FONT_CYAN)🛠️  Development:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)dev$(FONT_RESET)             Start dev environment (hot reload)"
	@echo -e "  $(FONT_PURPLE)dev-core$(FONT_RESET)        Dev with local forge-core (for debugging)"
	@echo -e "  $(FONT_PURPLE)dev-core-off$(FONT_RESET)    Switch back to git dependencies"
	@echo -e "  $(FONT_PURPLE)prod$(FONT_RESET)            Build and test production package"
	@echo -e "  $(FONT_PURPLE)forge$(FONT_RESET)           Alias for 'make prod'"
	@echo -e "  $(FONT_PURPLE)backend$(FONT_RESET)         Backend only (use BP=port to override)"
	@echo -e "  $(FONT_PURPLE)frontend$(FONT_RESET)        Frontend only (use FP=port to override)"
	@echo -e "  $(FONT_PURPLE)build$(FONT_RESET)           Build production package (no launch)"
	@echo -e "  $(FONT_PURPLE)test$(FONT_RESET)            Run full test suite"
	@echo -e "  $(FONT_PURPLE)clean$(FONT_RESET)           Clean build artifacts"
	@echo ""
	@echo -e "$(FONT_CYAN)📦 Service Management:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)start-local$(FONT_RESET)     Start with PM2"
	@echo -e "  $(FONT_PURPLE)stop-local$(FONT_RESET)      Stop PM2 service"
	@echo -e "  $(FONT_PURPLE)restart-local$(FONT_RESET)   Restart PM2 service"
	@echo -e "  $(FONT_PURPLE)service-status$(FONT_RESET)  Check PM2 status"
	@echo -e "  $(FONT_PURPLE)logs$(FONT_RESET)            Show recent logs (N=30)"
	@echo -e "  $(FONT_PURPLE)logs-follow$(FONT_RESET)     Follow logs in real-time"
	@echo -e "  $(FONT_PURPLE)health$(FONT_RESET)          Check service health"
	@echo ""
	@echo -e "$(FONT_CYAN)🐧 System Service (Ubuntu/Debian):$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)service$(FONT_RESET)         Install systemd service (interactive)"
	@echo ""
	@echo -e "$(FONT_CYAN)🚀 Release & Publish:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)publish$(FONT_RESET)         Complete release pipeline"
	@echo -e "  $(FONT_PURPLE)beta$(FONT_RESET)            Beta release"
	@echo -e "  $(FONT_PURPLE)version$(FONT_RESET)         Show version info"
	@echo ""
	@echo -e "$(FONT_GRAY)Examples:$(FONT_RESET)"
	@echo -e "  $(FONT_GRAY)make install$(FONT_RESET)              # Full installation"
	@echo -e "  $(FONT_GRAY)make dev$(FONT_RESET)                  # Start development"
	@echo -e "  $(FONT_GRAY)make update$(FONT_RESET)               # Update to latest"
	@echo -e "  $(FONT_GRAY)make logs N=50$(FONT_RESET)            # Show 50 log lines"
	@echo ""

# ===========================================
# 📦 Installation & Setup
# ===========================================

.PHONY: install install-deps install-complete install-complete-no-pm2
install: ## $(ROCKET) Full interactive installation (6 phases)
	$(call print_status,Starting Automagik Forge installation...)
	@echo ""

	# Phase 1: Prerequisites Check
	$(call print_status,Phase 1/6: Checking prerequisites...)
	@$(MAKE) check-android-deps
	@$(MAKE) check-cargo
	@$(call ensure_env_file)
	$(call print_success,Prerequisites verified!)
	@echo ""

	# Phase 2: Node.js Dependencies
	$(call print_status,Phase 2/6: Installing Node.js dependencies...)
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo -e "$(FONT_RED)$(ERROR) pnpm not found$(FONT_RESET)"; \
		echo -e "$(FONT_YELLOW)💡 Install with: npm install -g pnpm$(FONT_RESET)"; \
		exit 1; \
	fi
	@pnpm install
	@cd frontend && pnpm install
	$(call print_success,Node.js dependencies installed!)
	@echo ""

	# Phase 3: Build Application
	$(call print_status,Phase 3/6: Building application...)
	@bash scripts/build/build.sh
	$(call print_success,Application built successfully!)
	@echo ""

	# Phase 4: PM2 Setup (Interactive)
	$(call print_status,Phase 4/6: PM2 Process Manager)
	@if command -v pm2 >/dev/null 2>&1; then \
		PM2_VERSION=$$(pm2 --version 2>/dev/null || echo "unknown"); \
		echo -e "$(FONT_GREEN)$(CHECKMARK) PM2 $$PM2_VERSION already installed$(FONT_RESET)"; \
	else \
		echo -e "$(FONT_YELLOW)$(WARNING) PM2 not installed$(FONT_RESET)"; \
		echo -e "$(FONT_CYAN)PM2 is a process manager for production deployments.$(FONT_RESET)"; \
		echo -e "$(FONT_CYAN)Features: auto-restart, log management, monitoring$(FONT_RESET)"; \
		read -p "Install PM2 globally? [y/N] " -n 1 -r REPLY; echo; \
		if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
			echo -e "$(FONT_PURPLE)$(HAMMER) Installing PM2...$(FONT_RESET)"; \
			npm install -g pm2 || { \
				echo -e "$(FONT_RED)$(ERROR) PM2 installation failed$(FONT_RESET)"; \
				echo -e "$(FONT_YELLOW)💡 Try: sudo npm install -g pm2$(FONT_RESET)"; \
				exit 1; \
			}; \
			PM2_VERSION=$$(pm2 --version); \
			echo -e "$(FONT_GREEN)$(CHECKMARK) PM2 $$PM2_VERSION installed!$(FONT_RESET)"; \
		else \
			echo -e "$(FONT_YELLOW)Skipped.$(FONT_RESET)"; \
		fi; \
	fi
	@echo ""

	# Phase 5: PM2 Configuration
	@if command -v pm2 >/dev/null 2>&1; then \
		echo -e "$(FONT_PURPLE)$(HAMMER) Phase 5/6: Configuring PM2...$(FONT_RESET)"; \
		pm2 install pm2-logrotate >/dev/null 2>&1 || true; \
		pm2 set pm2-logrotate:max_size 100M >/dev/null 2>&1 || true; \
		pm2 set pm2-logrotate:retain 7 >/dev/null 2>&1 || true; \
		pm2 start $(PM2_CONFIG) >/dev/null 2>&1 || pm2 restart "$(SERVICE_NAME)" >/dev/null 2>&1 || true; \
		pm2 save --force >/dev/null 2>&1 || true; \
		echo -e "$(FONT_GREEN)$(CHECKMARK) PM2 configured and service started!$(FONT_RESET)"; \
		pm2 status; \
		echo ""; \
		echo -e "$(FONT_PURPLE)$(HAMMER) Phase 6/6: System Service Setup$(FONT_RESET)"; \
		if [[ "$$(uname -s)" == "Linux" ]] && command -v systemctl >/dev/null 2>&1; then \
			read -p "Install as system service (auto-start on boot)? [y/N] " -n 1 -r REPLY; echo; \
			if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
				echo -e "$(FONT_PURPLE)$(HAMMER) Installing systemd service...$(FONT_RESET)"; \
				bash scripts/service/install-service.sh || echo -e "$(FONT_YELLOW)$(WARNING) systemd setup incomplete$(FONT_RESET)"; \
			else \
				echo -e "$(FONT_YELLOW)Skipped.$(FONT_RESET)"; \
			fi; \
		else \
			echo -e "$(FONT_CYAN)$(INFO) System service setup not available (Linux + systemd required)$(FONT_RESET)"; \
		fi; \
		echo ""; \
		$(MAKE) install-complete; \
	else \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Phase 5/6: Skipped (no PM2)$(FONT_RESET)"; \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Phase 6/6: Skipped (no PM2)$(FONT_RESET)"; \
		echo ""; \
		$(MAKE) install-complete-no-pm2; \
	fi

install-complete:
	@echo ""
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)$(SPARKLES) Installation Complete! 🎉$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_GREEN)$(ROCKET) Automagik Forge is now running!$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_CYAN)📊 Useful commands:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)make service-status$(FONT_RESET)   # Check PM2 status"
	@echo -e "  $(FONT_PURPLE)make logs$(FONT_RESET)             # View recent logs"
	@echo -e "  $(FONT_PURPLE)make logs-follow$(FONT_RESET)      # Follow logs in real-time"
	@echo -e "  $(FONT_PURPLE)make restart-local$(FONT_RESET)    # Restart service"
	@echo -e "  $(FONT_PURPLE)make health$(FONT_RESET)           # Run health checks"
	@echo -e "  $(FONT_PURPLE)make update$(FONT_RESET)           # Update to latest version"
	@echo ""
	@echo -e "$(FONT_CYAN)🌐 Access Forge:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)Check PM2 logs for port information$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_GREEN)Happy forging! $(HAMMER)$(FONT_RESET)"
	@echo ""

install-complete-no-pm2:
	@echo ""
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)$(SPARKLES) Installation Complete!$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_CYAN)$(INFO) Dependencies installed (PM2 not installed)$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_CYAN)$(ROCKET) To run Automagik Forge:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)make prod$(FONT_RESET)             # Run production build"
	@echo -e "  $(FONT_PURPLE)make dev$(FONT_RESET)              # Run development mode"
	@echo ""
	@echo -e "$(FONT_CYAN)💡 To install PM2 later:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)npm install -g pm2$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)make start-local$(FONT_RESET)     # Start with PM2"
	@echo ""

install-deps: ## 📦 Install dependencies only (skip PM2/systemd)
	$(call print_status,Installing dependencies...)
	@$(MAKE) check-android-deps
	@$(MAKE) check-cargo
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo -e "$(FONT_RED)$(ERROR) pnpm not found$(FONT_RESET)"; \
		echo -e "$(FONT_YELLOW)💡 Install with: npm install -g pnpm$(FONT_RESET)"; \
		exit 1; \
	fi
	@pnpm install
	@cd frontend && pnpm install
	@bash scripts/build/build.sh
	$(call print_success,Dependencies installed!)

# ===========================================
# 🔄 Update & Maintenance
# ===========================================

.PHONY: update
update: ## 🔄 Update installation (smart detection + deps + restart + health check)
	$(call print_status,Updating Automagik Forge...)
	@echo ""

	# Step 1: Smart update detection
	$(call print_status,Step 1/5: Checking for updates...)
	@git fetch origin
	@LOCAL_COMMIT=$$(git rev-parse HEAD); \
	REMOTE_COMMIT=$$(git rev-parse @{u} 2>/dev/null || git rev-parse origin/$$(git rev-parse --abbrev-ref HEAD)); \
	if [ "$$LOCAL_COMMIT" = "$$REMOTE_COMMIT" ]; then \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Already up-to-date!$(FONT_RESET)"; \
		echo ""; \
		echo -e "$(FONT_CYAN)Running health check...$(FONT_RESET)"; \
		$(MAKE) health || true; \
		echo ""; \
		echo -e "$(FONT_GREEN)$(SPARKLES) No update needed - service is current$(FONT_RESET)"; \
		exit 0; \
	fi; \
	echo -e "$(FONT_CYAN)$(INFO) Updates available: $$LOCAL_COMMIT → $$REMOTE_COMMIT$(FONT_RESET)"
	@echo ""

	# Step 2: Git pull
	$(call print_status,Step 2/5: Pulling latest changes...)
	@git pull || { \
		echo -e "$(FONT_RED)$(ERROR) Git pull failed$(FONT_RESET)"; \
		echo -e "$(FONT_YELLOW)💡 Check for uncommitted changes: git status$(FONT_RESET)"; \
		exit 1; \
	}
	$(call print_success,Latest changes pulled!)
	@echo ""

	# Step 3: Update dependencies and rebuild
	$(call print_status,Step 3/5: Updating dependencies and rebuilding...)
	@pnpm install
	@cd frontend && pnpm install
	@bash scripts/build/build.sh
	$(call print_success,Dependencies updated and application rebuilt!)
	@echo ""

	# Step 4: Restart service
	$(call print_status,Step 4/5: Restarting service...)
	@if command -v pm2 >/dev/null 2>&1 && pm2 show "$(SERVICE_NAME)" >/dev/null 2>&1; then \
		$(MAKE) restart-local; \
		echo -e "$(FONT_CYAN)⏳ Waiting for service to restart...$(FONT_RESET)"; \
		sleep 3; \
	elif systemctl is-active automagik-forge >/dev/null 2>&1; then \
		echo -e "$(FONT_PURPLE)Restarting systemd service...$(FONT_RESET)"; \
		sudo systemctl restart automagik-forge; \
		sleep 3; \
	else \
		echo -e "$(FONT_YELLOW)$(WARNING) No running service detected - skipping restart$(FONT_RESET)"; \
	fi
	@echo ""

	# Step 5: Health check with retry
	$(call print_status,Step 5/5: Running health checks...)
	@HEALTH_OK=0; \
	for i in 1 2 3 4 5; do \
		sleep 3; \
		if curl -sf --max-time 5 $(HEALTH_ENDPOINT) > /dev/null 2>&1; then \
			HEALTH_OK=1; \
			break; \
		fi; \
		echo -e "$(FONT_YELLOW)  Attempt $$i/5 - waiting for service...$(FONT_RESET)"; \
	done; \
	if [ $$HEALTH_OK -eq 1 ]; then \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Health check passed!$(FONT_RESET)"; \
	else \
		echo -e "$(FONT_YELLOW)$(WARNING) Health check failed - service may need more time$(FONT_RESET)"; \
	fi

	# Success summary
	@echo ""
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)$(SPARKLES) Update Completed Successfully!$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_CYAN)💡 Useful commands:$(FONT_RESET)"
	@echo -e "  $(FONT_PURPLE)make logs$(FONT_RESET)              # View recent logs"
	@echo -e "  $(FONT_PURPLE)make service-status$(FONT_RESET)   # Check service status"
	@echo -e "  $(FONT_PURPLE)make health$(FONT_RESET)           # Run health check again"
	@echo ""

# ===========================================
# 🗑️  Uninstall
# ===========================================

.PHONY: uninstall
uninstall: ## 🗑️  Uninstall Forge (remove PM2/systemd services, clean builds)
	@# Support non-interactive mode: UNINSTALL_CONFIRM=yes make uninstall
	@if [ "$(UNINSTALL_CONFIRM)" != "yes" ]; then \
		echo -e "$(FONT_YELLOW)$(WARNING) This will remove Forge services$(FONT_RESET)"; \
		read -p "Proceed with uninstall? [y/N] " -n 1 -r REPLY; echo; \
		if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
			echo -e "$(FONT_CYAN)Uninstall cancelled$(FONT_RESET)"; \
			exit 0; \
		fi; \
	fi
	$(call print_status,Starting Automagik Forge uninstall...)
	@echo ""

	# Phase 1: PM2 Service Removal
	$(call print_status,Phase 1/4: Checking PM2 service...)
	@if command -v pm2 >/dev/null 2>&1 && pm2 show "$(SERVICE_NAME)" >/dev/null 2>&1; then \
		echo -e "$(FONT_PURPLE)$(HAMMER) Removing PM2 service...$(FONT_RESET)"; \
		pm2 stop "$(SERVICE_NAME)" >/dev/null 2>&1 || true; \
		pm2 delete "$(SERVICE_NAME)" >/dev/null 2>&1 || true; \
		pm2 save --force >/dev/null 2>&1 || true; \
		echo -e "$(FONT_GREEN)$(CHECKMARK) PM2 service removed$(FONT_RESET)"; \
	else \
		echo -e "$(FONT_CYAN)$(INFO) No PM2 service found - skipping$(FONT_RESET)"; \
	fi
	@echo ""

	# Phase 2: Systemd Service Removal
	$(call print_status,Phase 2/4: Checking systemd service...)
	@if systemctl list-unit-files 2>/dev/null | grep -q automagik-forge; then \
		echo -e "$(FONT_PURPLE)$(HAMMER) Removing systemd service...$(FONT_RESET)"; \
		sudo systemctl stop automagik-forge 2>/dev/null || true; \
		sudo systemctl disable automagik-forge 2>/dev/null || true; \
		sudo rm -f /etc/systemd/system/automagik-forge.service; \
		sudo systemctl daemon-reload 2>/dev/null || true; \
		sudo systemctl reset-failed 2>/dev/null || true; \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Systemd service removed$(FONT_RESET)"; \
	else \
		echo -e "$(FONT_CYAN)$(INFO) No systemd service found - skipping$(FONT_RESET)"; \
	fi
	@echo ""

	# Phase 3: Dedicated Service Account Cleanup
	$(call print_status,Phase 3/4: Checking for dedicated service account...)
	@if id "forge" >/dev/null 2>&1; then \
		if [ "$(UNINSTALL_CONFIRM)" = "yes" ]; then \
			echo -e "$(FONT_PURPLE)$(HAMMER) Removing dedicated service account...$(FONT_RESET)"; \
			[ -d "/opt/automagik-forge" ] && sudo rm -rf /opt/automagik-forge; \
			[ -d "/var/lib/automagik-forge" ] && sudo rm -rf /var/lib/automagik-forge; \
			[ -d "/var/log/automagik-forge" ] && sudo rm -rf /var/log/automagik-forge; \
			sudo userdel forge 2>/dev/null || true; \
			echo -e "$(FONT_GREEN)$(CHECKMARK) Service account removed$(FONT_RESET)"; \
		else \
			echo -e "$(FONT_YELLOW)$(WARNING) Dedicated 'forge' service account found$(FONT_RESET)"; \
			echo -e "$(FONT_CYAN)The following will be removed:$(FONT_RESET)"; \
			echo -e "  - System user: forge"; \
			[ -d "/opt/automagik-forge" ] && echo -e "  - Directory: /opt/automagik-forge"; \
			[ -d "/var/lib/automagik-forge" ] && echo -e "  - Directory: /var/lib/automagik-forge"; \
			[ -d "/var/log/automagik-forge" ] && echo -e "  - Directory: /var/log/automagik-forge"; \
			echo ""; \
			read -p "Remove dedicated 'forge' user and directories? [y/N] " -n 1 -r REPLY; echo; \
			if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
				echo -e "$(FONT_PURPLE)$(HAMMER) Removing dedicated service account...$(FONT_RESET)"; \
				[ -d "/opt/automagik-forge" ] && sudo rm -rf /opt/automagik-forge; \
				[ -d "/var/lib/automagik-forge" ] && sudo rm -rf /var/lib/automagik-forge; \
				[ -d "/var/log/automagik-forge" ] && sudo rm -rf /var/log/automagik-forge; \
				sudo userdel forge 2>/dev/null || true; \
				echo -e "$(FONT_GREEN)$(CHECKMARK) Service account removed$(FONT_RESET)"; \
			else \
				echo -e "$(FONT_YELLOW)Skipped - service account kept$(FONT_RESET)"; \
			fi; \
		fi; \
	else \
		echo -e "$(FONT_CYAN)$(INFO) No dedicated service account found - skipping$(FONT_RESET)"; \
	fi
	@echo ""

	# Phase 4: Build Artifacts Cleanup
	$(call print_status,Phase 4/4: Cleaning build artifacts...)
	@$(MAKE) clean >/dev/null 2>&1 || true
	$(call print_success,Build artifacts cleaned!)
	@echo ""

	# Completion Summary
	@echo ""
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)$(SPARKLES) Uninstall Complete!$(FONT_RESET)"
	@echo -e "$(FONT_GREEN)========================================$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_GREEN)✓ What was removed:$(FONT_RESET)"
	@echo -e "  • PM2 service (if installed)"
	@echo -e "  • Systemd service (if installed)"
	@echo -e "  • Build artifacts"
	@echo ""
	@echo -e "$(FONT_CYAN)ℹ️  What was kept:$(FONT_RESET)"
	@echo -e "  • .env file (configuration)"
	@echo -e "  • Source code"
	@echo -e "  • Node dependencies (node_modules)"
	@echo -e "  • Global tools (PM2, pnpm, cargo)"
	@echo ""
	@echo -e "$(FONT_PURPLE)$(ROCKET) To reinstall:$(FONT_RESET) make install"
	@echo ""

# ===========================================
# 🩺 Health Checks
# ===========================================

.PHONY: health
health: ## 🩺 Check service health
	$(call print_status,Checking Automagik Forge health...)
	@FAILED=0; \
	\
	if command -v pm2 >/dev/null 2>&1 && pm2 show "$(SERVICE_NAME)" >/dev/null 2>&1; then \
		echo -e "$(FONT_CYAN)Service Status (PM2):$(FONT_RESET)"; \
		pm2 describe "$(SERVICE_NAME)" | grep -E "status|uptime|restarts" || true; \
		echo ""; \
	fi; \
	\
	if systemctl is-active automagik-forge >/dev/null 2>&1; then \
		echo -e "$(FONT_CYAN)Service Status (systemd):$(FONT_RESET)"; \
		systemctl status automagik-forge --no-pager -l | head -15; \
		echo ""; \
	fi; \
	\
	echo -e "$(FONT_CYAN)Testing health endpoint...$(FONT_RESET)"; \
	echo -e "  Endpoint: $(HEALTH_ENDPOINT)"; \
	\
	if curl -sf --max-time 5 $(HEALTH_ENDPOINT) > /dev/null 2>&1; then \
		echo -e "  $(FONT_GREEN)$(CHECKMARK) Health check passed$(FONT_RESET)"; \
	else \
		echo -e "  $(FONT_RED)$(ERROR) Health check failed$(FONT_RESET)"; \
		FAILED=1; \
	fi; \
	\
	if [ -f "forge-app/forge.db" ]; then \
		if sqlite3 forge-app/forge.db "SELECT 1;" >/dev/null 2>&1; then \
			echo -e "  $(FONT_GREEN)$(CHECKMARK) Database connectivity OK$(FONT_RESET)"; \
		else \
			echo -e "  $(FONT_YELLOW)$(WARNING) Database exists but may be locked$(FONT_RESET)"; \
		fi; \
	else \
		echo -e "  $(FONT_YELLOW)$(WARNING) Database not found (first run?)$(FONT_RESET)"; \
	fi; \
	\
	exit $$FAILED

# ===========================================
# 📦 PM2 Service Management
# ===========================================

.PHONY: setup-pm2 start-local stop-local restart-local service-status logs logs-follow

setup-pm2: ## 📦 Setup PM2 ecosystem and log rotation
	$(call print_status,Setting up PM2 ecosystem...)
	@$(call check_pm2)
	@echo -e "$(FONT_CYAN)$(INFO) Installing PM2 log rotation...$(FONT_RESET)"
	@if ! pm2 list | grep -q pm2-logrotate; then \
		pm2 install pm2-logrotate; \
	else \
		echo -e "$(FONT_GREEN)✓ PM2 logrotate already installed$(FONT_RESET)"; \
	fi
	@pm2 set pm2-logrotate:max_size 100M
	@pm2 set pm2-logrotate:retain 7
	@pm2 set pm2-logrotate:compress true
	@echo -e "$(FONT_CYAN)$(INFO) Configuring PM2 startup...$(FONT_RESET)"
	@pm2 startup | grep "sudo" || echo -e "$(FONT_YELLOW)Run the command above to enable auto-start$(FONT_RESET)"
	$(call print_success,PM2 ecosystem configured!)

start-local: ## $(ROCKET) Start Forge with PM2
	$(call print_status,Starting Automagik Forge with PM2...)
	@$(call check_pm2)
	@$(call ensure_env_file)
	@pm2 start $(PM2_CONFIG)
	@pm2 save --force
	$(call print_success,Forge started with PM2!)
	@echo ""
	@pm2 status

stop-local: ## 🛑 Stop PM2 service
	$(call print_status,Stopping Automagik Forge...)
	@$(call check_pm2)
	@pm2 stop "$(SERVICE_NAME)" 2>/dev/null || true
	$(call print_success,Forge stopped!)

restart-local: ## 🔄 Restart PM2 service
	$(call print_status,Restarting Automagik Forge...)
	@$(call check_pm2)
	@pm2 restart "$(SERVICE_NAME)" 2>/dev/null || pm2 start $(PM2_CONFIG)
	@pm2 save --force
	$(call print_success,Forge restarted!)

service-status: ## 📊 Check PM2 service status
	$(call print_status,PM2 Service Status)
	@$(call check_pm2)
	@pm2 show "$(SERVICE_NAME)" 2>/dev/null || echo -e "$(FONT_YELLOW)Service not found or not running$(FONT_RESET)"

logs: ## 📄 Show recent service logs (N=lines, default 30)
	$(eval N := $(or $(N),30))
	$(call print_status,Recent logs ($(N) lines))
	@if command -v pm2 >/dev/null 2>&1 && pm2 show "$(SERVICE_NAME)" >/dev/null 2>&1; then \
		pm2 logs "$(SERVICE_NAME)" --lines $(N) --nostream 2>/dev/null; \
	elif [ -f "logs/forge-combined.log" ]; then \
		echo -e "$(FONT_CYAN)Showing direct log file:$(FONT_RESET)"; \
		tail -n $(N) logs/forge-combined.log; \
	else \
		echo -e "$(FONT_YELLOW)$(WARNING) No logs found$(FONT_RESET)"; \
	fi

logs-follow: ## 📄 Follow logs in real-time
	$(call print_status,Following logs (Ctrl+C to stop))
	@echo ""
	@if command -v pm2 >/dev/null 2>&1 && pm2 show "$(SERVICE_NAME)" >/dev/null 2>&1; then \
		pm2 logs "$(SERVICE_NAME)" 2>/dev/null; \
	elif [ -f "logs/forge-combined.log" ]; then \
		tail -f logs/forge-combined.log; \
	else \
		echo -e "$(FONT_YELLOW)$(WARNING) No logs found$(FONT_RESET)"; \
	fi

# ===========================================
# 🛠️ Development & Building
# ===========================================

# Check and install cargo if needed (OS agnostic)
check-cargo:
	@PATH="$$HOME/.cargo/bin:$$PATH"; \
	export PATH; \
	if command -v cargo >/dev/null 2>&1; then \
		echo "✅ Cargo already installed: $$(cargo --version)"; \
	else \
		echo "🦀 Cargo not found. Installing Rust toolchain..."; \
		if [ -d "/data/data/com.termux" ]; then \
			echo "📱 Termux detected - installing via pkg..."; \
			pkg install -y rust; \
		else \
			echo "🌐 Installing via rustup (Linux/macOS/WSL)..."; \
			curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; \
			PATH="$$HOME/.cargo/bin:$$PATH"; \
			export PATH; \
		fi; \
		echo "✅ Rust toolchain installed"; \
	fi; \
	if cargo watch --version >/dev/null 2>&1; then \
		echo "✅ cargo-watch already installed: $$(cargo watch --version)"; \
	else \
		echo "🔧 Installing cargo-watch..."; \
		if [ "$$(uname)" = "Darwin" ]; then \
			echo "🍎 macOS detected - using Homebrew for cargo-watch..."; \
			if command -v brew >/dev/null 2>&1; then \
				brew install cargo-watch; \
			else \
				echo "⚠️  Homebrew not found, trying cargo install..."; \
				cargo install cargo-watch || { echo "❌ Failed to install cargo-watch"; exit 1; }; \
			fi; \
		else \
			cargo install cargo-watch || { echo "❌ Failed to install cargo-watch"; exit 1; }; \
		fi; \
		if cargo watch --version >/dev/null 2>&1; then \
			echo "✅ cargo-watch installed: $$(cargo watch --version)"; \
		else \
			echo "❌ cargo-watch installation failed"; \
			exit 1; \
		fi; \
	fi

# Check and install Android/Termux build dependencies
check-android-deps:
	@if [ -d "/data/data/com.termux" ]; then \
		echo "📱 Checking Android/Termux build dependencies..."; \
		MISSING_DEPS=""; \
		for dep in perl openssl pkg-config make clang; do \
			if ! command -v $$dep &> /dev/null; then \
				MISSING_DEPS="$$MISSING_DEPS $$dep"; \
			fi; \
		done; \
		if [ -n "$$MISSING_DEPS" ]; then \
			echo "📦 Installing missing dependencies:$$MISSING_DEPS"; \
			pkg install -y$$MISSING_DEPS; \
			echo "✅ Dependencies installed"; \
		else \
			echo "✅ All build dependencies present"; \
		fi; \
	else \
		if command -v dpkg >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then \
			echo "🐧 Checking Debian/Ubuntu build dependencies..."; \
			NEEDS_UPDATE=0; \
			if ! command -v cc >/dev/null 2>&1 || ! command -v gcc >/dev/null 2>&1; then \
				echo "📦 Installing build-essential (C/C++ compiler toolchain)..."; \
				NEEDS_UPDATE=1; \
			fi; \
			if ! dpkg -l | grep -q libclang-dev; then \
				echo "📦 Installing libclang-dev..."; \
				NEEDS_UPDATE=1; \
			fi; \
			if [ $$NEEDS_UPDATE -eq 1 ]; then \
				sudo apt-get update && sudo apt-get install -y build-essential libclang-dev; \
				echo "✅ Build dependencies installed"; \
			else \
				echo "✅ All build dependencies present"; \
			fi; \
		else \
			echo "ℹ️  Non-Debian system detected - skipping package checks"; \
			echo "   (Ensure gcc/clang and build tools are installed via your package manager)"; \
		fi; \
	fi
  
# Ensure cargo config exists (uses base config by default)
ensure-cargo-config:
	@if [ ! -f ".cargo/config.toml" ]; then \
		cp .cargo/config.base.toml .cargo/config.toml; \
	fi

# Development mode - hot reload (backend first, then frontend)
dev: check-android-deps check-cargo ensure-cargo-config
	@bash scripts/dev/run-dev.sh

# =============================================================================
# Cross-Repo Development (automagik-forge + forge-core)
# =============================================================================

BRANCH ?= $(shell git branch --show-current)

# Development with local forge-core (enhanced with branch selection + safety hooks)
# ============================================================================
# DEV-CORE: Local forge-core development
# Uses Cargo [patch] in .cargo/config.toml - no file swapping needed
# ============================================================================

dev-core: check-android-deps check-cargo ## Start dev with local forge-core
	@echo ""
	@echo -e "$(FONT_PURPLE)🔧 Starting local forge-core development...$(FONT_RESET)"
	@# Pre-flight: Check workspace compatibility (prevents cryptic cargo errors)
	@if ! grep -q '^\[workspace\.package\]' Cargo.toml; then \
		echo ""; \
		echo -e "$(FONT_RED)❌ Missing [workspace.package] in Cargo.toml$(FONT_RESET)"; \
		echo "    forge-core crates use 'version.workspace = true'"; \
		echo "    Add this to Cargo.toml:"; \
		echo ""; \
		echo "    [workspace.package]"; \
		echo "    version = \"0.8.4\""; \
		echo "    edition = \"2021\""; \
		echo ""; \
		exit 1; \
	fi
	@if ! grep -qE '^rmcp\s*=' Cargo.toml; then \
		echo ""; \
		echo -e "$(FONT_RED)❌ Missing 'rmcp' in [workspace.dependencies]$(FONT_RESET)"; \
		echo "    forge-core/server crate needs: rmcp = { workspace = true }"; \
		echo "    Add to [workspace.dependencies]:"; \
		echo ""; \
		echo "    rmcp = { version = \"0.8.5\" }"; \
		echo ""; \
		exit 1; \
	fi
	@# Clone or update forge-core with smart branch sync
	@CURRENT_BRANCH=$$(git branch --show-current); \
	if [ ! -d "forge-core" ]; then \
		echo -e "$(FONT_CYAN)📦 Cloning forge-core...$(FONT_RESET)"; \
		if ! git clone https://github.com/namastexlabs/forge-core.git forge-core; then \
			echo -e "$(FONT_RED)❌ FATAL: git clone failed$(FONT_RESET)"; \
			echo -e "$(FONT_YELLOW)Check network connectivity$(FONT_RESET)"; \
			exit 1; \
		fi; \
	fi; \
	echo -e "$(FONT_CYAN)📥 Syncing forge-core to branch: $$CURRENT_BRANCH$(FONT_RESET)"; \
	cd forge-core && git fetch --all --tags 2>/dev/null; \
	if git show-ref --verify --quiet refs/remotes/origin/$$CURRENT_BRANCH; then \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Branch '$$CURRENT_BRANCH' exists in forge-core$(FONT_RESET)"; \
		git checkout $$CURRENT_BRANCH 2>/dev/null || git checkout -b $$CURRENT_BRANCH origin/$$CURRENT_BRANCH; \
		git pull origin $$CURRENT_BRANCH 2>/dev/null || true; \
	else \
		echo -e "$(FONT_YELLOW)⚠️  Branch '$$CURRENT_BRANCH' not in forge-core - creating from dev$(FONT_RESET)"; \
		git checkout dev 2>/dev/null && git pull origin dev 2>/dev/null || true; \
		git checkout -b $$CURRENT_BRANCH 2>/dev/null || git checkout $$CURRENT_BRANCH; \
	fi; \
	echo -e "$(FONT_GREEN)$(CHECKMARK) forge-core synced to branch: $$CURRENT_BRANCH$(FONT_RESET)"
	@echo -e "$(FONT_CYAN)📍 forge-core @ $$(cd forge-core && git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)$(FONT_RESET)"
	@# Enable [patch] section in .cargo/config.toml
	@echo -e "$(FONT_CYAN)⚙️  Enabling Cargo [patch] overrides...$(FONT_RESET)"
	@sed -i 's/^# \[patch\./[patch./g' .cargo/config.toml
	@sed -i 's/^# db = /db = /g' .cargo/config.toml
	@sed -i 's/^# services = /services = /g' .cargo/config.toml
	@sed -i 's/^# server = /server = /g' .cargo/config.toml
	@sed -i 's/^# deployment = /deployment = /g' .cargo/config.toml
	@sed -i 's/^# local-deployment = /local-deployment = /g' .cargo/config.toml
	@sed -i 's/^# executors = /executors = /g' .cargo/config.toml
	@sed -i 's/^# utils = /utils = /g' .cargo/config.toml
	@# Regenerate Cargo.lock for path deps
	@rm -f Cargo.lock
	@cargo fetch 2>/dev/null || true
	@# Install pre-push safety hook
	@mkdir -p .git/hooks scripts/hooks
	@if [ -f scripts/hooks/pre-push ]; then \
		cp scripts/hooks/pre-push .git/hooks/pre-push; \
		chmod +x .git/hooks/pre-push; \
		echo -e "$(FONT_GREEN)$(CHECKMARK) Safety hook installed$(FONT_RESET)"; \
	fi
	@echo -e "$(FONT_GREEN)$(CHECKMARK) Using local forge-core at ./forge-core$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_YELLOW)ℹ  Cargo [patch] auto-detects ./forge-core$(FONT_RESET)"
	@echo -e "$(FONT_YELLOW)ℹ  Run 'make dev-core-off' to disable$(FONT_RESET)"
	@echo ""
	@FORGE_WATCH_PATHS="forge-core/crates" bash scripts/dev/run-dev.sh

dev-core-off: ## Disable local forge-core (use git deps)
	@echo -e "$(FONT_CYAN)🔄 Disabling Cargo [patch] overrides...$(FONT_RESET)"
	@# Comment out forge-core [patch] section ONLY (not crates-io patches)
	@sed -i 's/^\[patch\."https:\/\/github.com\/namastexlabs\/forge-core.git"\]/# [patch."https:\/\/github.com\/namastexlabs\/forge-core.git"]/g' .cargo/config.toml
	@sed -i 's/^db = { path/# db = { path/g' .cargo/config.toml
	@sed -i 's/^services = { path/# services = { path/g' .cargo/config.toml
	@sed -i 's/^server = { path/# server = { path/g' .cargo/config.toml
	@sed -i 's/^deployment = { path/# deployment = { path/g' .cargo/config.toml
	@sed -i 's/^local-deployment = { path/# local-deployment = { path/g' .cargo/config.toml
	@sed -i 's/^executors = { path/# executors = { path/g' .cargo/config.toml
	@sed -i 's/^utils = { path/# utils = { path/g' .cargo/config.toml
	@rm -f Cargo.lock
	@cargo fetch 2>/dev/null || true
	@echo -e "$(FONT_GREEN)$(CHECKMARK) Using git dependencies$(FONT_RESET)"

dev-core-status: ## Show dev-core mode status
	@echo ""
	@if grep -q '^\[patch\.' .cargo/config.toml 2>/dev/null; then \
		echo -e "Mode:   $(FONT_GREEN)LOCAL$(FONT_RESET) (Cargo [patch] active)"; \
		if [ -d "forge-core" ]; then \
			echo -e "Branch: $$(cd forge-core && git branch --show-current 2>/dev/null || echo 'detached')"; \
			echo -e "Commit: $$(cd forge-core && git log -1 --format='%h %s' 2>/dev/null || echo 'unknown')"; \
		else \
			echo -e "$(FONT_RED)⚠️  WARNING: forge-core/ directory missing!$(FONT_RESET)"; \
		fi; \
	else \
		echo -e "Mode:   $(FONT_CYAN)GIT$(FONT_RESET) (using tag from Cargo.toml)"; \
		EXPECTED_TAG=$$(grep -oP 'tag\s*=\s*"\K[^"]+' forge-app/Cargo.toml 2>/dev/null | head -1); \
		if [ -n "$$EXPECTED_TAG" ]; then \
			echo -e "Tag:    $$EXPECTED_TAG"; \
		fi; \
	fi
	@echo ""

# Dev-core health check (diagnostics)
dev-core-check: ## Health check for dev-core workspace
	@echo -e "$(FONT_BOLD)Dev-Core Health Check$(FONT_RESET)"
	@echo ""
	@if grep -q '^\[patch\.' .cargo/config.toml 2>/dev/null; then \
		echo -e "Mode:     $(FONT_GREEN)ACTIVE$(FONT_RESET) (Cargo [patch] enabled)"; \
	else \
		echo -e "Mode:     $(FONT_YELLOW)INACTIVE$(FONT_RESET) (using git dependencies)"; \
	fi
	@if [ -d "forge-core" ]; then \
		echo -e "Core dir: $(FONT_GREEN)EXISTS$(FONT_RESET)"; \
		echo -e "Branch:   $$(cd forge-core && git branch --show-current)"; \
		echo -e "Version:  $$(cd forge-core && git describe --tags --always 2>/dev/null || echo 'no tags')"; \
	else \
		echo -e "Core dir: $(FONT_RED)MISSING$(FONT_RESET)"; \
	fi
	@if [ -f ".git/hooks/pre-push" ]; then \
		echo -e "Hook:     $(FONT_GREEN)INSTALLED$(FONT_RESET)"; \
	else \
		echo -e "Hook:     $(FONT_YELLOW)NOT INSTALLED$(FONT_RESET)"; \
	fi

# Version consistency check
check-versions: ## Validate version consistency across all files
	@./scripts/check-versions.sh

# Show comprehensive cross-repo status
status: ## Show comprehensive cross-repo status
	@echo ""
	@echo -e "$(FONT_BOLD)$(FONT_PURPLE)🔍 Cross-Repo Status$(FONT_RESET)"
	@echo ""
	@# Dev-core mode
	@if grep -q '^\[patch\.' .cargo/config.toml 2>/dev/null; then \
		echo -e "Dev-core:       $(FONT_GREEN)ACTIVE$(FONT_RESET) (Cargo [patch])"; \
	else \
		echo -e "Dev-core:       $(FONT_CYAN)OFF$(FONT_RESET) (git deps)"; \
	fi
	@# Branches
	@echo -e "forge branch:   $$(git branch --show-current)"; \
	if [ -d "forge-core" ]; then \
		echo -e "core branch:    $$(cd forge-core && git branch --show-current)"; \
	else \
		echo -e "core branch:    $(FONT_YELLOW)not cloned$(FONT_RESET)"; \
	fi
	@# Versions
	@EXPECTED_TAG=$$(grep -oP 'tag\s*=\s*"\K[^"]+' forge-app/Cargo.toml 2>/dev/null | head -1); \
	echo -e "Cargo.toml tag: $$EXPECTED_TAG"; \
	if [ -d "forge-core" ]; then \
		LOCAL_TAG=$$(cd forge-core && git describe --tags --abbrev=0 2>/dev/null || echo "unknown"); \
		echo -e "Local core tag: $$LOCAL_TAG"; \
	fi
	@# Uncommitted changes
	@echo ""; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo -e "forge changes:  $(FONT_YELLOW)$$(git status --porcelain | wc -l) files$(FONT_RESET)"; \
	else \
		echo -e "forge changes:  $(FONT_GREEN)clean$(FONT_RESET)"; \
	fi; \
	if [ -d "forge-core" ] && [ -n "$$(cd forge-core && git status --porcelain)" ]; then \
		echo -e "core changes:   $(FONT_YELLOW)$$(cd forge-core && git status --porcelain | wc -l) files$(FONT_RESET)"; \
	elif [ -d "forge-core" ]; then \
		echo -e "core changes:   $(FONT_GREEN)clean$(FONT_RESET)"; \
	fi
	@# Ready to push?
	@echo ""; \
	if grep -q '^\[patch\.' .cargo/config.toml 2>/dev/null; then \
		echo -e "Ready to push:  $(FONT_RED)NO$(FONT_RESET) (run make dev-core-off first)"; \
	elif [ -n "$$(git status --porcelain)" ] || ([ -d "forge-core" ] && [ -n "$$(cd forge-core && git status --porcelain)" ]); then \
		echo -e "Ready to push:  $(FONT_YELLOW)MAYBE$(FONT_RESET) (uncommitted changes)"; \
	else \
		echo -e "Ready to push:  $(FONT_GREEN)YES$(FONT_RESET)"; \
	fi
	@echo ""

# Quick help for cross-repo commands
dev-help:
	@echo ""
	@echo -e "$(FONT_BOLD)$(FONT_PURPLE)🔗 Cross-Repo Development Commands$(FONT_RESET)"
	@echo ""
	@echo -e "$(FONT_CYAN)Starting:$(FONT_RESET)"
	@echo "  make dev-core              Enable local forge-core development"
	@echo "  make dev-core BRANCH=x     Sync to a specific branch"
	@echo ""
	@echo -e "$(FONT_CYAN)How it works:$(FONT_RESET)"
	@echo "  1. Clones/syncs forge-core to same branch as automagik-forge"
	@echo "  2. If branch doesn't exist in forge-core, creates it from dev"
	@echo "  3. Enables Cargo [patch] to use local forge-core paths"
	@echo "  4. Installs pre-push hook to prevent accidental pushes"
	@echo ""
	@echo -e "$(FONT_CYAN)During development:$(FONT_RESET)"
	@echo "  make status                Cross-repo status (branches, versions)"
	@echo "  make dev-core-status       Detailed dev-core status"
	@echo "  make dev-core-check        Health check diagnostics"
	@echo ""
	@echo -e "$(FONT_CYAN)Before PRs:$(FONT_RESET)"
	@echo "  make dev-core-off          Disable [patch], restore git deps"
	@echo "  git push                   Push to automagik-forge (standard git)"
	@echo "  gh pr create               Create PR in automagik-forge"
	@echo ""
	@echo -e "$(FONT_CYAN)Automation:$(FONT_RESET)"
	@echo "  When your automagik-forge PR merges to dev:"
	@echo "  - sync-to-forge-core.yml auto-syncs changes to forge-core"
	@echo "  - No manual interaction with forge-core repo needed"
	@echo ""
	@echo -e "$(FONT_CYAN)Safety:$(FONT_RESET)"
	@echo "  - Pre-push hook blocks pushes if [patch] is active"
	@echo "  - Run 'make dev-core-off' before pushing"
	@echo ""

# Production mode - test what will be published
prod: check-android-deps check-cargo
	@echo "📦 Building and running production package..."
	@bash scripts/dev/run-prod.sh

# Alias for prod
forge: prod

# Port override parameters (shared between backend and frontend targets)
# FP = Frontend Port, BP = Backend Port
# If not provided, uses dynamic port allocation from setup-dev-environment.js
FP ?=
BP ?=

# Create stub frontend/dist for backend compilation (dev isolation)
ensure-frontend-stub:
	@if [ ! -d "frontend/dist" ] || [ -z "$$(ls -A frontend/dist 2>/dev/null)" ]; then \
		echo "📁 Creating stub frontend/dist for backend compilation..."; \
		mkdir -p frontend/dist; \
		echo '<!DOCTYPE html><html><body><h1>Dev Mode</h1><p>Use separate frontend dev server at http://localhost:3000</p></body></html>' > frontend/dist/index.html; \
		echo "✅ Stub created (backend can compile, frontend runs independently)"; \
	fi

# Ensure frontend dependencies are installed (for dev/prod)
ensure-frontend-deps:
	@if [ ! -d "frontend/node_modules" ] || [ ! -f "frontend/node_modules/.bin/cross-env" ]; then \
		echo "📦 Installing frontend dependencies..."; \
		cd frontend && pnpm install; \
		echo "✅ Frontend dependencies installed"; \
	fi

# Build full frontend assets (for production)
build-frontend: ensure-frontend-deps
	@echo "🔨 Building production frontend..."; \
	cd frontend && pnpm run build

# Backend only (dev isolation - no frontend build required)
backend: ensure-frontend-stub
	@echo "⚙️  Starting backend server (dev mode)..."
	@if [ -n "$(BP)" ]; then \
		echo "   Using manual port override: $(BP)"; \
		BACKEND_PORT=$(BP) npm run backend:dev; \
	else \
		DYNAMIC_BP=$$(node scripts/setup-dev-environment.js backend); \
		echo "   Backend Port: $$DYNAMIC_BP"; \
		BACKEND_PORT=$$DYNAMIC_BP npm run backend:dev; \
	fi

# Frontend only
frontend: ensure-frontend-deps
	@echo "🎨 Starting frontend server (dev mode)..."
	@DYNAMIC_FP=$$(node scripts/setup-dev-environment.js read-frontend); \
	DYNAMIC_BP=$$(node scripts/setup-dev-environment.js read-backend); \
	FINAL_FP=$${FP:-$$DYNAMIC_FP}; \
	FINAL_BP=$${BP:-$$DYNAMIC_BP}; \
	echo "   Frontend Port: $$FINAL_FP"; \
	echo "   Backend Port: $$FINAL_BP"; \
	FRONTEND_PORT=$$FINAL_FP BACKEND_PORT=$$FINAL_BP npm run frontend:dev

# Build production package (without launching)
build: check-android-deps check-cargo
	@echo "🔨 Building production package..."
	@bash scripts/build/build.sh

# Run tests
test:
	@echo "🧪 Running test suite..."
	@npm run test:all

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf npx-cli/dist
	@rm -f npx-cli/*.tgz
	@cargo clean
	@echo "✅ Clean complete"

# Complete release pipeline: version bump + build + publish + release notes
publish:
	@echo "🚀 Complete Release Pipeline"
	@echo "This will:"
	@echo "  1. Let you choose version bump type (patch/minor/major)"
	@echo "  2. Trigger GitHub Actions to bump version and build all platforms"
	@echo "  3. Generate AI-powered release notes with Genie (semantic analysis)"
	@echo "  4. Create GitHub release and publish to npm"
	@echo ""
	@./gh-build.sh publish

# Beta release with auto-incremented version
beta:
	@./gh-build.sh beta

# Version info
version:
	@echo "Current versions:"
	@echo "  Root:         $$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Frontend:     $$(grep '"version"' frontend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  NPX CLI:      $$(grep '"version"' npx-cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Forge App:    $$(grep 'version =' forge-app/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Forge Omni:   $$(grep 'version =' forge-extensions/omni/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Forge Config: $$(grep 'version =' forge-extensions/config/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"

# Manual NPM publish from downloaded artifacts (when automated publish fails)
npm:
	@bash scripts/publish-npm.sh $(RUN_ID)

# A/B test publish: full release pipeline from dev branch, publish as 'automagik'
publish-automagik:
	@bash scripts/publish-automagik.sh

# Install as systemd service (Ubuntu/Debian only)
service:
	@echo "🐧 Installing Automagik Forge as systemd service..."
	@echo ""
	@if [ ! -f /etc/os-release ]; then \
		echo "❌ Error: Cannot detect OS (requires /etc/os-release)"; \
		exit 1; \
	fi; \
	. /etc/os-release; \
	if [ "$$ID" != "ubuntu" ] && [ "$$ID" != "debian" ]; then \
		echo "❌ Error: Unsupported OS ($$PRETTY_NAME)"; \
		echo ""; \
		echo "This target only supports:"; \
		echo "  - Ubuntu 18.04+"; \
		echo "  - Debian 10+"; \
		echo ""; \
		echo "For other systems, see DEPLOYMENT.md for manual setup."; \
		exit 1; \
	fi; \
	if ! command -v systemctl >/dev/null 2>&1; then \
		echo "❌ Error: systemd not found"; \
		exit 1; \
	fi; \
	bash scripts/service/install-service.sh
