# Raggedy Slacky

A Slack Archive Retrieval-Augmented Generation (RAG) System that enables searching and interacting with archived Slack workspace content using AI.

## Overview

Raggedy Slacky is a modern application that provides a rich interface to search and explore a decade's worth of Slack conversations. The system uses a combination of traditional database storage and vector embeddings to enable both keyword and semantic search capabilities, while incorporating an AI assistant that can answer questions about the archive's content.

## Features

- **Import Slack Exports**: Process JSON exports from Slack workspaces
- **Semantic Search**: Find conceptually related content beyond keyword matches
- **Filtered Search**: Filter by date ranges, users, and channels
- **AI-Enhanced Q&A**: Ask natural language questions about conversations
- **Conversation Summaries**: Generate summaries of lengthy discussions
- **User Authentication**: Secure access with JWT authentication
- **API-First Design**: Well-documented RESTful API endpoints

## Technologies

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL for metadata storage
- **Vector Store**: Chroma for embeddings and semantic search
- **ORM**: TypeORM for database interactions
- **AI Integration**: Abstraction for LLMs (Llama 3)
- **Package Manager**: pnpm for dependency management
- **Containerization**: Docker and Docker Compose

## System Architecture

### Component Overview

- **Data Layer**: PostgreSQL + Chroma Vector DB
- **API Layer**: NestJS REST API
- **Process Layer**: RAG orchestration and Slack import services
- **Security Layer**: JWT authentication and guards

### Data Flow

1. **Import**: Slack exports are parsed and stored in PostgreSQL, with text embedded in Chroma
2. **Search**: User queries are processed, vectorized, and matched against the vector store
3. **Response**: Results are enriched with metadata from PostgreSQL and returned
4. **Conversation**: AI responses are generated using context retrieved from the vector store

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [pnpm](https://pnpm.io/) (v8.15.4 or later)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

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

## Running the Application

### Development Mode

```bash
# Run locally
pnpm start:dev

# Run with Docker Compose (recommended)
docker-compose -f docker-compose.dev.yml up
```

### Production Mode

```bash
# Build
pnpm build

# Run locally
pnpm start:prod

# Run with Docker Compose (recommended)
docker-compose up -d
```

## Database Management

### Running Migrations

Database migrations are managed through TypeORM. The following commands are available for managing migrations:

```bash
# Create a new migration
pnpm migration:create <migration-name>

# Run migrations
pnpm migration:run

# Revert the last migration
pnpm migration:revert

# Run migrations in Docker container
./scripts/run-migrations-docker.sh
```

### Seeding the Database

You can seed the database with initial data using:

```bash
# Seed the database locally
pnpm seed

# Seed the database in Docker container
./scripts/seed-database-docker.sh
```

## Working with Slack Exports

### Preparing the Slack Export

1. Export your Slack workspace data (as a workspace admin)
2. Unzip the export to the `data/slack-archive` directory in the project root
   - This directory is gitignored and already configured in the environment
   - The directory structure should look like:
     ```
     data/slack-archive/
     ├── users.json
     ├── channels.json
     ├── channel1/
     │   ├── 2020-01-01.json
     │   └── ...
     ├── channel2/
     │   ├── 2020-01-01.json
     │   └── ...
     └── ...
     ```

### Importing the Data

You can import the data using the API endpoint in one of two ways:

1. Using the default path (recommended):
```bash
curl -X POST http://localhost:3000/api/admin/slack/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"resetData": false}'
```

2. Specifying a custom path:
```bash
curl -X POST http://localhost:3000/api/admin/slack/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"path": "/custom/path/to/slack/export", "resetData": false}'
```

The `resetData` parameter (optional, defaults to `false`):
- When `true`: Clears existing data before importing
- When `false`: Adds new data without removing existing data

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Log in and receive JWT token
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Log out current user

### Search

- `POST /api/search` - Perform search with filters
- `GET /api/search/channels` - List available channels
- `GET /api/search/users` - List Slack users in the archive

### RAG

- `POST /api/chat` - Submit message to conversational interface

### Admin

- `POST /api/admin/slack/import` - Import Slack export data

### System

- `GET /api/health` - Detailed health check with system stats and service status

## Testing

```bash
# Unit tests
pnpm test

# Test coverage
pnpm test:cov

# End-to-end tests
pnpm test:e2e
```

## Code Quality

```bash
# Run ESLint
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
src/
├── entities/              # TypeORM entity definitions
│   ├── user.entity.ts     # Application user
│   ├── slack-user.entity.ts  # Slack workspace member
│   ├── channel.entity.ts  # Slack channel
│   ├── message.entity.ts  # Slack message metadata
│   ├── message-content.entity.ts  # Message content storage
│   ├── attachment.entity.ts  # File attachments
│   ├── user-query.entity.ts  # User search history
│   ├── conversation.entity.ts  # RAG conversations
│   └── conversation-message.entity.ts  # Individual RAG messages
│
├── modules/               # Feature modules
│   ├── auth/              # Authentication
│   │   ├── dto/           # Data transfer objects
│   │   ├── guards/        # JWT and local guards
│   │   ├── strategies/    # Passport strategies
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   │
│   ├── users/             # User management
│   │   ├── dto/           # Data transfer objects
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   │
│   ├── search/            # Search functionality
│   │   ├── dto/           # Data transfer objects
│   │   ├── search.service.ts
│   │   ├── vector.service.ts  # Vector DB integration
│   │   ├── search.controller.ts
│   │   └── search.module.ts
│   │
│   ├── rag/               # RAG orchestration
│   │   ├── dto/           # Data transfer objects
│   │   ├── rag.service.ts
│   │   ├── llm.service.ts  # LLM integration
│   │   ├── rag.controller.ts
│   │   └── rag.module.ts
│   │
│   └── slack/             # Slack data processing
│       ├── dto/           # Data transfer objects
│       ├── slack.service.ts
│       ├── slack-parser.service.ts  # JSON parser
│       ├── indexing.service.ts  # DB & vector indexing
│       ├── slack.controller.ts
│       └── slack.module.ts
│
├── app.controller.ts      # App controller with health check
├── app.service.ts         # App service
├── app.module.ts          # Main application module
└── main.ts                # Application entry point
```

## Environment Variables

Create a `.env` file based on `.env.example` with the following variables:

```
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=raggedy-slacky
DB_LOGGING=true

# JWT Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400

# Vector Database (Chroma)
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## Docker Deployment

The application includes Docker and Docker Compose configurations for both development and production environments.

### Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production

```bash
docker-compose up -d
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### CI Workflows

- **Lint & Test**: Runs on every push and pull request to the `main` branch
  - Lints the code to ensure style consistency
  - Runs all tests with a dedicated PostgreSQL service
  - Builds the application to verify compilation

- **Security Scan**: Runs on pushes, pull requests, and weekly schedule
  - Scans dependencies for known vulnerabilities
  - Runs code quality and security analysis
  - Scans Docker image for vulnerabilities

### CD Workflows

- **Docker Build**: Builds Docker images on pushes to `main` and version tags
  - Creates Docker images with appropriate tags
  - Prepares for deployment to staging or production

- **Staging Deployment**: Automatically deploys to staging on pushes to `main`
  - Uses the `latest` Docker image
  - Sets up staging environment for testing

- **Production Deployment**: Deploys to production on version tags (e.g., `v1.0.0`)
  - Uses specifically tagged Docker images
  - Ensures stable, versioned releases

### Running CI Locally

You can validate your changes before pushing by running:

```bash
# Lint check
pnpm lint

# Run tests
pnpm test

# Build verification
pnpm build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request following the PR template

## License

This project is [MIT licensed](LICENSE).