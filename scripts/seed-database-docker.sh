#!/bin/bash

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "backend.*Up"; then
  echo "Error: Docker Compose services are not running"
  echo "Please start the services first with: docker-compose up -d"
  exit 1
fi

# Display info
echo "Seeding database in Docker container..."

# Execute seed command inside the Docker container
docker-compose exec backend npm run seed

echo "Database seeding completed!"
