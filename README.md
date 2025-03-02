# Raggedy Slacky

A Slack Archive RAG System that enables searching and interacting with archived Slack workspace content using AI.

## Technologies

- NestJS with TypeScript
- PostgreSQL for metadata
- Chroma for vector embeddings
- TypeORM for database ORM
- pnpm for package management

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [pnpm](https://pnpm.io/) (v8.15.4 or later)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (for containerized development)

## Installation

### Install pnpm

```bash
# Using npm
npm install -g pnpm@8.15.4

# Using corepack (Node.js 16.13.0 or later)
corepack enable
corepack prepare pnpm@8.15.4 --activate
```

### Install dependencies

```bash
pnpm install
```

## Running the application

### Development mode

```bash
# Run locally
pnpm start:dev

# Run with Docker Compose
docker-compose -f docker-compose.dev.yml up
```

### Production mode

```bash
# Build
pnpm build

# Run locally
pnpm start:prod

# Run with Docker Compose
docker-compose up -d
```

## Testing

```bash
# Unit tests
pnpm test

# Test coverage
pnpm test:cov

# End-to-end tests
pnpm test:e2e
```

## Linting and formatting

```bash
# Run ESLint
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
src/
├── entities/         # TypeORM entities
├── modules/          # Feature modules
│   ├── auth/         # Authentication module
│   ├── users/        # User management module
│   ├── search/       # Search functionality module
│   ├── rag/          # RAG orchestration module
│   └── slack/        # Slack data processing module
├── app.module.ts     # Main application module
└── main.ts           # Application entry point
```

## Environment Variables

See `.env.example` for required environment variables.

## License

This project is [MIT licensed](LICENSE).