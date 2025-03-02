#!/bin/bash

# Default environment is development
ENV=${1:-development}

echo "Seeding database for environment: $ENV"

# Load environment variables from the appropriate .env file
if [ -f ".env.$ENV" ]; then
  export $(grep -v '^#' .env.$ENV | xargs)
  echo "Loaded environment variables from .env.$ENV"
else
  echo "Warning: .env.$ENV file not found, using existing environment variables"
fi

# Path to the seed file
SEED_FILE="./src/seeds/seed.ts"

# Check if seed file exists
if [ ! -f "$SEED_FILE" ]; then
  echo "Error: Seed file not found at $SEED_FILE"
  exit 1
fi

# Run the seed file
echo "Running seed script..."
npx ts-node $SEED_FILE

echo "Database seeding completed!"