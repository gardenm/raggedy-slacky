#!/bin/bash

# Check if a migration name is provided
if [ -z "$1" ]; then
  echo "Error: Migration name is required"
  echo "Usage: ./scripts/create-migration.sh <migration-name>"
  exit 1
fi

# Create migration file using TypeORM CLI
echo "Creating migration: $1"
npx typeorm migration:create ./src/migrations/$1

echo "Migration created successfully!"
echo "You can now edit the migration file in src/migrations/"