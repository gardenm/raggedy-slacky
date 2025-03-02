#\!/bin/bash

# Check if Docker Compose is running
if \! docker-compose ps | grep -q "app.*Up"; then
  echo "Error: Docker Compose services are not running"
  echo "Please start the services first with: docker-compose up -d"
  exit 1
fi

# Display info
echo "Running database migrations in Docker container..."

# Execute migrations inside the Docker container
docker-compose exec app npm run migration:run

echo "Migrations completed\!"
