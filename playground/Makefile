.PHONY: help install run dev build preview lint lint-fix typecheck audit clean

.DEFAULT_GOAL := help

# Use pnpm if installed, otherwise run it through npx
PNPM := $(shell command -v pnpm 2> /dev/null || echo "npx -y pnpm@10")

# Workspace packages the playground imports (served from their dist/ folders)
PACKAGES := --filter "./packages/*"

help: ## Show this help
	@echo "Playground commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-10s %s\n", $$1, $$2}'

install: ## Install dependencies and build the workspace packages
	cd .. && $(PNPM) install
	cd .. && $(PNPM) $(PACKAGES) build

run: ## Start the dev server
	$(PNPM) run dev

dev: run

build: ## Production build into dist/
	$(PNPM) run build

preview: build ## Serve the production build locally
	$(PNPM) run preview

lint: ## Run ESLint
	$(PNPM) run lint

lint-fix: ## Run ESLint and fix what it can
	$(PNPM) exec eslint . --fix

typecheck: ## Type-check with TypeScript
	$(PNPM) exec tsc -b

audit: ## Check dependencies for known vulnerabilities
	$(PNPM) audit

clean: ## Remove node_modules and dist
	rm -rf node_modules dist
	@echo "Cleaned node_modules and dist"
