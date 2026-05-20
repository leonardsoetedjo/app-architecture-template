# App Architecture Template Makefile
# Provides common development tasks using docker-compose

.PHONY: build up down test clean new-service help

help:
	@echo "Available targets:"
	@echo "  build   - Build all docker images (without cache)"
	@echo "  up      - Start all services in detached mode"
	@echo "  down    - Stop and remove containers, volumes, and networks"
	@echo "  test    - Run Java tests + frontend tests + Bruno API tests"
	@echo "  clean   - Stop and remove all containers and volumes"
	@echo "  new-service - Create a new service using the boilerplate"
	@echo "  help    - Show this help message"
build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

test:
	@echo "Running Java tests..."
	cd boilerplate/java/common && mvn test
	@echo "Running frontend tests..."
	cd boilerplate/frontend && npm test
	@echo "Running Bruno API tests..."
	bru run

test-python:
	@echo "Running Python tests..."
	cd boilerplate/python/order-service/order-service-python && python -m pytest tests/ -v

clean:
	docker compose down -v --remove-orphans

new-service:
ifeq ($(NAME),)
	$(error NAME is required. Usage: make new-service NAME=service-name)
endif
ifdef NAME
	$(info Creating new service: $(NAME))
	./scripts/new-page.sh $(NAME)
endif
