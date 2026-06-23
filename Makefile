# Makefile для dev-окружения «Генератор КП по SEO».
# Управляет двумя частями: локальный Postgres в Docker + Next dev-сервер.
# Подсказка по командам: просто `make` или `make help`.

# --- Параметры (можно переопределить: make start PG_PORT=5433) ---
PG_CONTAINER ?= seocp-pg
PG_IMAGE     ?= postgres:16-alpine
PG_PORT      ?= 5432
PG_DB        ?= seocp
PG_USER      ?= postgres
PG_PASSWORD  ?= test
PG_VOLUME    ?= seocp-pgdata
DATABASE_URL ?= postgres://$(PG_USER):$(PG_PASSWORD)@localhost:$(PG_PORT)/$(PG_DB)

DEV_PORT ?= 3000
DEV_LOG  := .dev-server.log
DEV_PID  := .dev-server.pid

.DEFAULT_GOAL := help

.PHONY: help init start up dev restart stop down logs status \
        db-up db-stop db-logs psql stop-dev check-env check-docker \
        test build typecheck clean

help: ## Показать список команд
	@echo "Генератор КП по SEO — dev-окружение"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Основные сценарии
# ---------------------------------------------------------------------------

init: check-docker ## Первичная настройка: зависимости, .env.local, БД
	@echo "1/3 Устанавливаю зависимости..."
	@npm install
	@echo "2/3 Готовлю .env.local..."
	@if [ -f .env.local ]; then \
		echo "     .env.local уже есть — не трогаю"; \
	else \
		echo 'DATABASE_URL="$(DATABASE_URL)"' > .env.local; \
		echo "     создан .env.local с локальным DATABASE_URL"; \
	fi
	@echo "3/3 Поднимаю Postgres..."
	@$(MAKE) --no-print-directory db-up
	@echo
	@echo "Готово. Дальше: 'make dev' (foreground) или 'make start' (в фоне)."
	@echo "Таблица proposals создастся автоматически при первом сохранении КП."

start: up ## Синоним up: поднять БД и запустить dev-сервер в фоне
up: check-env db-up
	@if [ -f "$(DEV_PID)" ] && kill -0 $$(cat $(DEV_PID)) 2>/dev/null; then \
		echo "dev-сервер уже запущен (pid $$(cat $(DEV_PID)))"; \
	else \
		echo "Запускаю dev-сервер в фоне (логи: make logs)..."; \
		nohup npm run dev > $(DEV_LOG) 2>&1 & echo $$! > $(DEV_PID); \
		echo "dev-сервер запущен (pid $$(cat $(DEV_PID))), порт ~$(DEV_PORT)"; \
	fi

dev: check-env db-up ## Запустить dev-сервер в foreground (live-логи, Ctrl+C — выход)
	npm run dev

restart: ## Перезапустить dev-окружение (БД + сервер)
	@$(MAKE) --no-print-directory stop
	@$(MAKE) --no-print-directory up

stop: down ## Синоним down: остановить dev-сервер и БД (данные сохраняются)
down: stop-dev db-stop

# ---------------------------------------------------------------------------
# Вспомогательные
# ---------------------------------------------------------------------------

logs: ## Следить за логом фонового dev-сервера
	@touch $(DEV_LOG); tail -f $(DEV_LOG)

status: ## Показать состояние БД и dev-сервера
	@echo "== Postgres =="
	@if [ -n "$$(docker ps -q -f name=^/$(PG_CONTAINER)$$ 2>/dev/null)" ]; then \
		docker ps -f name=^/$(PG_CONTAINER)$$ --format "   {{.Names}} — {{.Status}} ({{.Ports}})"; \
	elif [ -n "$$(docker ps -aq -f name=^/$(PG_CONTAINER)$$ 2>/dev/null)" ]; then \
		echo "   $(PG_CONTAINER) — остановлен"; \
	else \
		echo "   контейнер не создан (make db-up)"; \
	fi
	@echo "== dev-сервер =="
	@if [ -f "$(DEV_PID)" ] && kill -0 $$(cat $(DEV_PID)) 2>/dev/null; then \
		echo "   запущен (pid $$(cat $(DEV_PID))), порт ~$(DEV_PORT)"; \
	else \
		echo "   не запущен"; \
	fi

psql: ## Открыть psql внутри контейнера БД
	@docker exec -it $(PG_CONTAINER) psql -U $(PG_USER) -d $(PG_DB)

db-logs: ## Логи контейнера Postgres
	@docker logs -f $(PG_CONTAINER)

test: ## Юнит-тесты расчёта
	@npm test

build: ## Прод-сборка (полная проверка типов)
	@npm run build

typecheck: ## Проверка типов без сборки
	@npx tsc --noEmit

clean: stop-dev ## Удалить контейнер и данные БД, очистить временные файлы (ОПАСНО)
	@echo "Удаляю контейнер и том Postgres (локальные данные будут стёрты)..."
	@docker rm -f $(PG_CONTAINER) >/dev/null 2>&1 || true
	@docker volume rm $(PG_VOLUME) >/dev/null 2>&1 || true
	@rm -f $(DEV_PID) $(DEV_LOG)
	@echo "Очищено."

# ---------------------------------------------------------------------------
# Внутренние цели
# ---------------------------------------------------------------------------

db-up: check-docker
	@if [ -n "$$(docker ps -q -f name=^/$(PG_CONTAINER)$$)" ]; then \
		echo "Postgres уже запущен ($(PG_CONTAINER))"; \
	elif [ -n "$$(docker ps -aq -f name=^/$(PG_CONTAINER)$$)" ]; then \
		echo "Запускаю существующий контейнер $(PG_CONTAINER)..."; \
		docker start $(PG_CONTAINER) >/dev/null; \
	else \
		echo "Создаю контейнер $(PG_CONTAINER) ($(PG_IMAGE))..."; \
		docker run -d --name $(PG_CONTAINER) \
			-e POSTGRES_PASSWORD=$(PG_PASSWORD) \
			-e POSTGRES_DB=$(PG_DB) \
			-p $(PG_PORT):5432 \
			-v $(PG_VOLUME):/var/lib/postgresql/data \
			$(PG_IMAGE) >/dev/null; \
	fi
	@printf "Жду готовности Postgres"; \
	for i in $$(seq 1 30); do \
		if docker exec $(PG_CONTAINER) pg_isready -U $(PG_USER) >/dev/null 2>&1; then echo " — готов"; exit 0; fi; \
		printf "."; sleep 1; \
	done; \
	echo " — не дождался, см. make db-logs"; exit 1

db-stop:
	@docker stop $(PG_CONTAINER) >/dev/null 2>&1 && echo "Postgres остановлен (данные сохранены)" || echo "Postgres не запущен"

stop-dev:
	@if [ -f "$(DEV_PID)" ] && kill -0 $$(cat $(DEV_PID)) 2>/dev/null; then \
		PID=$$(cat $(DEV_PID)); \
		echo "Останавливаю dev-сервер (pid $$PID)..."; \
		killtree() { for c in $$(pgrep -P $$1 2>/dev/null); do killtree $$c; done; kill $$1 2>/dev/null || true; }; \
		killtree $$PID; \
	else \
		echo "dev-сервер не запущен"; \
	fi; \
	rm -f $(DEV_PID)

check-docker:
	@command -v docker >/dev/null 2>&1 || { echo "Docker не установлен или не в PATH"; exit 1; }
	@docker info >/dev/null 2>&1 || { echo "Docker-демон не запущен"; exit 1; }

check-env:
	@if [ ! -f .env.local ] && [ -z "$$DATABASE_URL" ]; then \
		echo "Нет .env.local и переменной DATABASE_URL. Сначала выполните: make init"; \
		exit 1; \
	fi
