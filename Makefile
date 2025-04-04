# Dev commands

tunnel:
	dotenvx run -- npm run tunnel

dev:start
	dotenvx run -- npm run dev

test:
	dotenvx run -- npm run test

studio:
	dotenvx run -- npx @langchain/langgraph-cli@0.0.14 dev

init-db:
	dotenvx run -- npm run init-all

build: ## Build docker image
	dotenvx run -- docker compose build

start:build ## Build and start docker containers
	dotenvx run -- docker compose up -d 
# docker compose up -d --force-recreate

status: ## Get status of containers
	docker compose ps

logs: ## Get logs of containers
	docker compose logs --tail=0 --follow

restart: ## Restart docker containers
	dotenvx run -- docker compose restart

stop: ## Stop docker containers
	docker compose stop

clean:stop ## Stop docker containers, clean data and workspace
	docker compose down -v --remove-orphans
