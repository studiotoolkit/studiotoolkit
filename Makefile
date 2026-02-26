.PHONY: help install build dev clean test test-watch test-ui test-color-wheel test-color-palette test-color-from-image lint lint-fix format format-check check-deps update-deps publish check-pnpm install-pnpm

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Check if pnpm is installed
PNPM := $(shell command -v pnpm 2> /dev/null)

help: ## Show this help message
	@echo "$(CYAN)Studio Toolkit - Makefile Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

check-pnpm:
	@if [ -z "$(PNPM)" ]; then \
		echo "$(RED)Error: pnpm is not installed!$(NC)"; \
		echo "$(YELLOW)Please run 'make install-pnpm' to install pnpm$(NC)"; \
		echo "$(YELLOW)Or install manually: npm install -g pnpm$(NC)"; \
		exit 1; \
	fi

install-pnpm: ## Install pnpm globally using npm
	@echo "$(CYAN)Installing pnpm...$(NC)"
	@if command -v npm > /dev/null 2>&1; then \
		npm install -g pnpm; \
		echo "$(GREEN)✓ pnpm installed successfully$(NC)"; \
	else \
		echo "$(RED)Error: npm is not installed. Please install Node.js first.$(NC)"; \
		echo "$(YELLOW)Visit: https://nodejs.org/$(NC)"; \
		exit 1; \
	fi

install: check-pnpm ## Install all dependencies
	@echo "$(CYAN)Installing dependencies...$(NC)"
	pnpm install

setup: check-pnpm install ## Setup the project (alias for install)
	@echo "$(GREEN)✓ Project setup complete$(NC)"

build: check-pnpm ## Build all packages
	@echo "$(CYAN)Building all packages...$(NC)"
	pnpm build
	@echo "$(GREEN)✓ Build complete$(NC)"

build-color-from-image: ## Build color-from-image package
	@echo "$(CYAN)Building @studiotoolkit/color-from-image...$(NC)"
	pnpm --filter @studiotoolkit/color-from-image build

build-color-palette: ## Build color-palette package
	@echo "$(CYAN)Building @studiotoolkit/color-palette...$(NC)"
	pnpm --filter @studiotoolkit/color-palette build

build-color-wheel: ## Build color-wheel package
	@echo "$(CYAN)Building @studiotoolkit/color-wheel...$(NC)"
	pnpm --filter @studiotoolkit/color-wheel build

build-generator: ## Build color-palette-generator package
	@echo "$(CYAN)Building @studiotoolkit/color-palette-generator...$(NC)"
	pnpm --filter @studiotoolkit/color-palette-generator build

dev: ## Run all packages in development mode
	@echo "$(CYAN)Starting development mode...$(NC)"
	pnpm dev

dev-color-from-image: ## Run color-from-image in dev mode
	pnpm --filter @studiotoolkit/color-from-image dev

dev-color-palette: ## Run color-palette in dev mode
	pnpm --filter @studiotoolkit/color-palette dev

dev-color-wheel: ## Run color-wheel in dev mode
	pnpm --filter @studiotoolkit/color-wheel dev

dev-generator: ## Run color-palette-generator in dev mode
	pnpm --filter @studiotoolkit/color-palette-generator dev

dev-playground: ## Run playground in dev mode
	@echo "$(CYAN)Starting playground...$(NC)"
	pnpm --filter colors dev

build-playground: ## Build playground
	@echo "$(CYAN)Building playground...$(NC)"
	pnpm --filter colors build

clean: ## Clean all build artifacts
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	pnpm -r clean
	@echo "$(GREEN)✓ Clean complete$(NC)"

clean-all: clean ## Clean build artifacts and node_modules
	@echo "$(CYAN)Removing node_modules...$(NC)"
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf playground/node_modules
	rm -rf .pnpm-store
	@echo "$(GREEN)✓ Deep clean complete$(NC)"

test: ## Run tests for all packages
	@echo "$(CYAN)Running tests...$(NC)"
	pnpm test

test-watch: check-pnpm ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(NC)"
	pnpm test:watch

test-ui: check-pnpm ## Open Vitest UI
	@echo "$(CYAN)Opening Vitest UI...$(NC)"
	pnpm test:ui

test-color-wheel: check-pnpm ## Test color-wheel package
	@echo "$(CYAN)Testing @studiotoolkit/color-wheel...$(NC)"
	pnpm --filter @studiotoolkit/color-wheel test

test-color-palette: check-pnpm ## Test color-palette package
	@echo "$(CYAN)Testing @studiotoolkit/color-palette...$(NC)"
	pnpm --filter @studiotoolkit/color-palette test

test-color-from-image: check-pnpm ## Test color-from-image package
	@echo "$(CYAN)Testing @studiotoolkit/color-from-image...$(NC)"
	pnpm --filter @studiotoolkit/color-from-image test

lint: check-pnpm ## Lint all packages
	@echo "$(CYAN)Linting code...$(NC)"
	pnpm lint

lint-fix: check-pnpm ## Fix linting issues automatically
	@echo "$(CYAN)Fixing linting issues...$(NC)"
	pnpm -r lint:fix

format: check-pnpm ## Format code with prettier
	@echo "$(CYAN)Formatting code...$(NC)"
	pnpm format

format-check: check-pnpm ## Check code formatting
	@echo "$(CYAN)Checking code formatting...$(NC)"
	pnpm format:check

check-deps: ## Check for outdated dependencies
	@echo "$(CYAN)Checking for outdated dependencies...$(NC)"
	pnpm outdated

update-deps: ## Update dependencies interactively
	@echo "$(CYAN)Updating dependencies...$(NC)"
	pnpm update -i

check: ## Run all checks (lint, test, build)
	@echo "$(CYAN)Running all checks...$(NC)"
	@make lint || true
	@make test || true
	@make build

publish-dry: ## Dry run of publishing packages
	@echo "$(CYAN)Dry run publish...$(NC)"
	pnpm -r publish --dry-run

publish: ## Publish all packages (use with caution!)
	@echo "$(RED)Publishing packages...$(NC)"
	@read -p "Are you sure you want to publish? (y/N): " confirm && [ $$confirm = y ] || exit 1
	pnpm -r publish

version: ## Show versions of all packages
	@echo "$(CYAN)Package versions:$(NC)"
	@for pkg in packages/*; do \
		if [ -f "$$pkg/package.json" ]; then \
			name=$$(cat $$pkg/package.json | grep '"name"' | head -1 | cut -d'"' -f4); \
			version=$$(cat $$pkg/package.json | grep '"version"' | head -1 | cut -d'"' -f4); \
			echo "  $(GREEN)$$name$(NC): $$version"; \
		fi \
	done

info: ## Show project information
	@echo "$(CYAN)Project: Studio Toolkit$(NC)"
	@echo "$(CYAN)Workspace:$(NC) pnpm monorepo"
	@echo "$(CYAN)Packages:$(NC)"
	@for pkg in packages/*; do \
		if [ -f "$$pkg/package.json" ]; then \
			name=$$(cat $$pkg/package.json | grep '"name"' | head -1 | cut -d'"' -f4); \
			echo "  - $$name"; \
		fi \
	done
	@echo "$(CYAN)Playground:$(NC)"
	@if [ -f "playground/package.json" ]; then \
		name=$$(cat playground/package.json | grep '"name"' | head -1 | cut -d'"' -f4); \
		echo "  - $$name"; \
	fi

graph: ## Show dependency graph
	@echo "$(CYAN)Dependency graph:$(NC)"
	pnpm list --depth 0 || true

watch: dev ## Watch mode (alias for dev)

rebuild: clean build ## Clean and rebuild all packages

init: clean-all install build ## Initialize project from scratch
	@echo "$(GREEN)✓ Project initialized successfully$(NC)"
