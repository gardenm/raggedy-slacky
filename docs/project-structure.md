# Project Structure Documentation

This document outlines the directory structure and organization of the Raggedy Slacky project.

## Root Structure

```
/
├── .github/               # GitHub configuration (workflows, PR templates)
├── docs/                  # Project documentation
├── scripts/               # Utility scripts for development and deployment
├── src/                   # Source code
├── data/                  # Data directory (gitignored)
│   └── slack-archive/     # Slack export data
├── docker-compose.yml     # Production Docker Compose configuration
├── docker-compose.dev.yml # Development Docker Compose configuration
├── Dockerfile             # Production Docker build
├── Dockerfile.dev         # Development Docker build
└── package.json           # Project metadata and dependencies
```

## Source Code Structure (`src/`)

```
src/
├── common/                # Common utilities, helpers, and NestJS components
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   ├── interceptors/      # Interceptors for request/response handling
│   ├── middleware/        # HTTP middleware
│   ├── pipes/             # Validation and transformation pipes
│   ├── types/             # TypeScript type definitions and interfaces
│   └── utils/             # Utility functions
│
├── config/                # Application configuration
│   └── configuration.ts   # Configuration factory
│
├── entities/              # TypeORM entity definitions
│   ├── user.entity.ts     # User entity
│   ├── slack-user.entity.ts # Slack user entity
│   ├── channel.entity.ts  # Channel entity
│   ├── message.entity.ts  # Message entity
│   └── user-query.entity.ts # User query history entity
│
├── migrations/            # Database migrations
│   └── datasource.ts      # TypeORM data source configuration
│
├── modules/               # Feature modules (organized by domain)
│   ├── auth/              # Authentication module
│   │   ├── dto/           # Data transfer objects
│   │   ├── guards/        # Authentication guards
│   │   ├── strategies/    # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/             # User management module
│   │   ├── dto/           # Data transfer objects
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── search/            # Search functionality module
│   │   ├── dto/           # Data transfer objects
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   ├── vector.service.ts  # Vector database integration
│   │   └── search.module.ts
│   │
│   ├── rag/               # RAG orchestration module
│   │   ├── dto/           # Data transfer objects
│   │   ├── rag.controller.ts
│   │   ├── rag.service.ts
│   │   ├── llm.service.ts # LLM integration
│   │   └── rag.module.ts
│   │
│   └── slack/             # Slack data processing module
│       ├── dto/           # Data transfer objects
│       ├── slack.controller.ts
│       ├── slack.service.ts
│       ├── slack-parser.service.ts
│       ├── indexing.service.ts
│       └── slack.module.ts
│
├── seeds/                 # Database seed data
│   └── seed.ts            # Seed script
│
├── app.controller.ts      # Root application controller
├── app.service.ts         # Root application service
├── app.module.ts          # Root application module
└── main.ts                # Application entry point
```

## Key Components Overview

### Common Components

- **Decorators**: Custom parameter and method decorators
- **Filters**: Error handling and exception processing
- **Guards**: Authentication and access control
- **Interceptors**: Request/response transformation and logging
- **Middleware**: HTTP request processing
- **Pipes**: Data validation and transformation

### Configuration

The application uses a centralized configuration system with environment variables, loaded via the `ConfigModule` and configured in `src/config/configuration.ts`.

### Entity Model

The entity model follows the specification, with:
- `User`: Application user accounts
- `SlackUser`: Slack workspace member data
- `Channel`: Slack channels information
- `Message`: Slack message metadata (content stored in vector DB)
- `UserQuery`: User search history

### Feature Modules

The application is organized into domain-focused modules:
- `AuthModule`: Handles user authentication and authorization
- `UsersModule`: Manages user accounts
- `SearchModule`: Provides search functionality
- `RagModule`: Orchestrates retrieval-augmented generation
- `SlackModule`: Processes and indexes Slack export data

### Database Migrations

Database migrations use TypeORM's migration system, with:
- `src/migrations/datasource.ts`: Configuration for migration commands
- Migration files created via `pnpm migration:create`

### Seeding

The application includes database seeding:
- `src/seeds/seed.ts`: Contains seed data and logic
- `scripts/seed-database.sh`: Script to run seeding for different environments

## Scripts

The project includes several utility scripts:
- `scripts/create-migration.sh`: Creates a new TypeORM migration file
- `scripts/seed-database.sh`: Seeds the database with initial data

## Docker Configuration

The application is containerized with Docker:
- `Dockerfile`: Production build
- `Dockerfile.dev`: Development build with hot-reload
- `docker-compose.yml`: Production services configuration
- `docker-compose.dev.yml`: Development services configuration