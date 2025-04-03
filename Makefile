# Dev commands

tunnel:
	ngrok http --domain=ladybird-winning-shiner.ngrok-free.app http://localhost:3000	

dev:start
	cd ./packages/api-server && dotenvx run -- npm run dev
	
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
