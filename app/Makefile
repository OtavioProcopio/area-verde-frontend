.PHONY: help install doctor dev build preview typecheck lint format format-check test test-coverage test-e2e test-e2e-ui test-e2e-report validate check ci docker-build compose-config ci-docker clean

IMAGE_NAME=area-verde-frontend
NODE ?= node
NPM ?= npm

help:
	@echo "Area Verde Frontend - comandos disponiveis"
	@echo ""
	@echo "Ambiente:"
	@echo "  make install          Instala dependencias com npm ci"
	@echo "  make doctor           Mostra ferramentas e versoes detectadas"
	@echo "  make dev              Sobe o Vite em modo desenvolvimento"
	@echo ""
	@echo "Qualidade:"
	@echo "  make build            Gera build de producao"
	@echo "  make preview          Sobe o preview do build"
	@echo "  make typecheck        Executa validacao de TypeScript"
	@echo "  make lint             Executa ESLint"
	@echo "  make format           Aplica Prettier nos arquivos alvo"
	@echo "  make format-check     Verifica formatacao sem alterar arquivos"
	@echo "  make test             Executa testes"
	@echo "  make test-coverage    Executa testes com cobertura"
	@echo "  make test-e2e         Executa a suite Playwright (exige API + frontend de pe)"
	@echo "  make test-e2e-ui      Abre a suite Playwright em modo UI"
	@echo "  make test-e2e-report  Abre o ultimo relatorio HTML do Playwright"
	@echo "  make validate         Executa format, typecheck, lint, cobertura e build"
	@echo "  make check            Executa format-check, typecheck, lint, cobertura e build"
	@echo "  make ci               Alias para check"
	@echo "  make ci-docker        Check + compose config + docker build"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     Constroi a imagem do frontend"
	@echo "  make compose-config   Valida o docker-compose do app"
	@echo ""
	@echo "Limpeza:"
	@echo "  make clean            Remove dist e coverage"

install:
	$(NPM) ci

doctor:
	@echo "Node: $$($(NODE) --version)"
	@echo "Node path: $$(command -v $(NODE) || true)"
	@echo "NPM: $$($(NPM) --version)"
	@echo "Make: $$(make --version | head -n 1)"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'not available')"
	@echo "Docker Compose: $$(docker compose version 2>/dev/null || echo 'not available')"

dev:
	$(NPM) run dev

build:
	$(NPM) run build

preview:
	$(NPM) run preview

typecheck:
	$(NPM) run typecheck

lint:
	$(NPM) run lint

format:
	$(NPM) run format

format-check:
	$(NPM) run format:check

test:
	$(NPM) run test

test-coverage:
	$(NPM) run test:coverage

test-e2e:
	$(NPM) run test:e2e

test-e2e-ui:
	$(NPM) run test:e2e:ui

test-e2e-report:
	$(NPM) run test:e2e:report

validate: format typecheck lint test-coverage build
	@echo "Full validation complete"

check: format-check typecheck lint test-coverage build
	@echo "Read-only validation complete"

ci: check
	@echo "CI validation complete"

docker-build:
	docker build -t $(IMAGE_NAME):local .

compose-config:
	docker compose config

ci-docker: check compose-config docker-build
	@echo "CI-like validation complete"

clean:
	rm -rf dist coverage
