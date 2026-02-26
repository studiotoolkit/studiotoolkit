.PHONY: help install dev build lint audit clean

# Note: This playground is part of a pnpm workspace.
# Most commands should be run from the root directory using the root Makefile.

help:
	@echo "Playground Commands (part of pnpm workspace)"
	@echo ""
	@echo "Note: Run these commands from the root directory instead:"
	@echo "  cd .. && make install        - Install all dependencies"
	@echo "  cd .. && make dev-playground - Start playground dev server"
	@echo "  cd .. && make build-playground - Build playground"
	@echo ""
	@echo "Direct commands (if needed):"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build production bundle"

install:
	@echo "Note: Please run 'cd .. && make install' from the root directory"
	@exit 1

dev:
	pnpm run dev

build:
	pnpm run build

lint:
	@echo "Note: Please run 'cd .. && make lint' from the root directory"
	@exit 1

audit:
	pnpm audit

clean:
	rm -rf node_modules dist
	@echo "Cleaned node_modules and dist directories"
