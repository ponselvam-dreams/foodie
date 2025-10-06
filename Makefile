# Remove PostgreSQL and Redis containers, images, and volumes
clean_all:
	-docker stop foodieaipg foodieairedis
	-docker rm foodieaipg foodieairedis
	-docker rmi foodieaipgimage foodieairedisimage
	-docker volume rm foodieaidbdata foodieairedisdata

# Backend (FastAPI)
run_backend:
	$(MAKE) run_db
	$(MAKE) run_redis
	cd backend && uvicorn app.main:app --reload

# Frontend (React)
run_frontend:
	cd frontend && npm start

# Build database Docker images
build_db:
	docker build -t foodieaipgimage -f ./database/Dockerfile.postgres .

# Run PostgreSQL container
run_db:
	@if [ -n "`docker ps -q -f name=foodieaipg`" ]; then \
		echo "Database container is already running."; \
	else \
		if [ -n "`docker ps -a -q -f name=foodieaipg`" ]; then \
			docker start foodieaipg; \
		else \
			docker run -d -p 5432:5432 --name foodieaipg -v foodieaidbdata:/var/lib/postgresql/data foodieaipgimage; \
		fi; \
	fi

# Stop PostgreSQL container
stop_db:
	docker stop foodieaipg

# Build redis container
build_redis:
	docker build -t foodieairedisimage -f ./database/Dockerfile.redis .

# run redis cli to check if redis is working fine
redis_cli:
	docker exec -it foodieairedis redis-cli -a foodieai@123

# Run Redis container
run_redis:
	@if [ -n "`docker ps -q -f name=foodieairedis`" ]; then \
		echo "Redis container is already running."; \
	else \
		if [ -n "`docker ps -a -q -f name=foodieairedis`" ]; then \
			docker start foodieairedis; \
		else \
			docker run -d -p 6379:6379 --name foodieairedis -v foodieairedisdata:/data foodieairedisimage; \
		fi \
	fi

# stop redis container
stop_redis:
	docker stop foodieairedis


.PHONY: run_backend run_frontend