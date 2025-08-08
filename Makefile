generate_proto: proto_auth proto_product proto_api

proto_auth:
	@echo "Generate proto auth"
	protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative auth-service/pb/*.proto
	@echo "Done!"

proto_product:
	@echo "Generate proto product"
	protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative product-service/pb/*.proto
	@echo "Done!"

proto_api:
	@echo "Delete proto from api-gateway"
	rm -rf api-gateway/pb/*
	@echo "Copy proto auth to api-gateway"
	cp -r auth-service/pb/*.proto api-gateway/pb/
	@echo "Copy proto product to api-gateway"
	cp -r product-service/pb/*.proto api-gateway/pb/
	@echo "Generate proto api-gateway"
	protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative api-gateway/pb/*.proto
	@echo "Done!"

up_build: 
	@echo "Stopping docker images (if running...)"
	docker-compose down
	@echo "Building (when required) and starting docker images..."
	docker-compose up --build -d
	@echo "Docker images built and started!"

down: 
	@echo "Stopping docker images (if running...)"
	docker-compose down
	@echo "Docker images built and started!"