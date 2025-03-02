# Slack Archive RAG System - Technical Specification

## Project Overview

This document outlines the technical specifications for developing a Retrieval-Augmented Generation (RAG) system for searching and interacting with an archived Slack workspace. The system will enable users to search through historical conversations with the assistance of an AI model, providing both traditional search capabilities and conversational AI interactions.

## Problem Statement

A group of friends has been using a free Slack workspace for approximately ten years. The free tier limits message history access, making it difficult to search or reference older conversations. While the complete archive has been exported (as JSON files), there's no user-friendly way to search and explore this content. This project aims to solve this problem by creating a modern, AI-enhanced interface to the archived conversations.

## Requirements

### Functional Requirements

1. **Data Processing**
   - Parse and index JSON files from Slack export (approximately 620MB of data spanning ~10 years)
   - Maintain metadata associations (authors, timestamps, channels) with message content
   - Support incremental updates if new exports are added in the future

2. **Search Capabilities**
   - Implement semantic search to find conceptually related content beyond keyword matching
   - Provide filtering by date ranges, users, and channels
   - Enable natural language queries about specific topics or persons (e.g., "Did Person X say anything about Topic Y")

3. **AI-Enhanced Features**
   - Generate summaries of lengthy discussions
   - Enable conversational interactions with specific channels or conversation threads
   - Support question-answering about the content of the archive

4. **User Interface**
   - Implement a chat-based interface for interacting with the system
   - Include traditional search elements (filters, date pickers, etc.)
   - Display search results with relevant metadata (author, timestamp, channel)
   - Show conversation context for results (messages before/after the matched content)

5. **User Management**
   - Support individual user accounts for all friends
   - Implement secure authentication
   - Store user preferences and search history

### Non-Functional Requirements

1. **Performance**
   - Support multiple concurrent users
   - Reasonable response times (under 5 seconds for complex queries)
   - Optimize for a small user base (less than 10 active users)

2. **Deployment**
   - Cloud-provider agnostic design that can run on services like DigitalOcean
   - Containerized application for easy deployment and portability
   - Monthly operational costs within $20 budget

3. **Extensibility**
   - Design with model flexibility to allow switching between local open-source LLMs and API-based services
   - Modular architecture to support future feature additions

4. **Maintenance**
   - Easy-to-maintain codebase in TypeScript
   - Comprehensive documentation
   - Reasonable test coverage

## Technical Architecture

### System Components

![System Architecture Diagram]

1. **Data Processing Pipeline**
   - Parser module for Slack JSON exports
   - Vector embedding generator
   - Vector database for efficient semantic search
   - Metadata database for storing user information and non-vector data

2. **Backend Services**
   - Authentication service
   - Search API
   - RAG orchestration service
   - LLM integration module

3. **Frontend Application**
   - React-based SPA with TypeScript
   - Chat interface component
   - Search filters and visualization components
   - Results display with conversation threading

### Data Flow

1. **Initial Data Processing**
   - Slack JSON files are parsed and normalized
   - Text content is embedded and stored in the vector database
   - Metadata (authors, timestamps, channels) is stored in the relational database
   - Relationships between messages in threads are preserved

2. **User Interaction Flow**
   - User submits a query through the chat interface
   - Query is processed to determine intent (search vs. conversation)
   - For search intents, the query is embedded and similar content is retrieved
   - For conversational intents, the LLM is provided with relevant context from the archive
   - Results are formatted and presented to the user
   - User interactions and queries are saved for potential future reference

## Technology Stack

### Backend

1. **Framework**: NestJS (TypeScript-based Node.js framework)
   - Provides structured architecture for building scalable server-side applications
   - Strong TypeScript support
   - Built-in support for dependency injection, facilitating modular design

2. **Databases**:
   - **Vector Store**: Chroma or Qdrant (open-source vector databases)
   - **Relational Database**: PostgreSQL for metadata, user accounts, and relationships

3. **LLM Integration**:
   - Primary: Llama 3 (8B or 70B parameter model, depending on server capabilities)
   - Abstraction layer to allow future integration with API services (e.g., OpenAI, Claude)
   - LangChain or LlamaIndex for RAG orchestration

4. **Authentication**:
   - JWT-based authentication
   - Secure password storage with bcrypt

### Frontend

1. **Framework**: Next.js (React framework)
   - Server-side rendering for better performance
   - TypeScript support
   - Built-in routing and API routes

2. **UI Components**:
   - Tailwind CSS for styling
   - Headless UI for accessible components
   - Custom chat interface with message threading

3. **State Management**:
   - React Query for server state
   - Context API or Zustand for client state

### DevOps

1. **Containerization**: Docker
   - Multi-stage builds to optimize container size
   - Docker Compose for local development

2. **Deployment**:
   - Docker Compose or simple VM deployment on DigitalOcean
   - GitHub Actions for CI/CD

## Data Model

### Vector Database

- **Collection**: SlackMessages
  - **Fields**:
    - messageId (string)
    - content (text)
    - embedding (vector)
    - timestamp (datetime)
    - channelId (string)
    - userId (string)
    - threadTs (string, nullable)

### Relational Database

1. **Users Table**
  - id (primary key)
  - username
  - email
  - passwordHash
  - createdAt
  - lastLogin

2. **SlackUsers Table**
  - id (primary key)
  - slackUserId (string)
  - username (string)
  - realName (string, nullable)
  - avatar (string, nullable)

3. **Channels Table**
  - id (primary key)
  - slackChannelId (string)
  - name (string)
  - purpose (string, nullable)
  - isPrivate (boolean)

4. **Messages Table** (metadata only, content in vector DB)
  - id (primary key)
  - slackMessageId (string)
  - slackUserId (foreign key)
  - channelId (foreign key)
  - timestamp (datetime)
  - threadTs (string, nullable)
  - hasAttachments (boolean)
  - reactions (JSON, nullable)

5. **UserQueries Table**
  - id (primary key)
  - userId (foreign key)
  - query (text)
  - timestamp (datetime)
  - results (JSON, nullable)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Log in and receive JWT token
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Log out current user

### Search and RAG

- `POST /api/search` - Perform search with filters
- `POST /api/chat` - Submit message to conversational interface
- `GET /api/channels` - List available channels
- `GET /api/users` - List Slack users in the archive
- `GET /api/messages/:id` - Get specific message with context
- `GET /api/threads/:threadTs` - Get entire thread of messages

### Admin

- `POST /api/admin/reindex` - Trigger reindexing of the archive
- `GET /api/admin/stats` - Get system statistics

## Implementation Plan

### Phase 1: Data Processing and Storage (Estimated: 2-3 days)

1. Set up development environment with Docker
2. Implement JSON parser for Slack exports
3. Design and implement database schemas
4. Create embedding pipeline for message content
5. Develop data loading scripts

### Phase 2: Core Backend Services (Estimated: 3-4 days)

1. Implement authentication system
2. Create search API using vector database
3. Integrate LLM for basic RAG functionality
4. Develop message retrieval and context building

### Phase 3: Frontend Development (Estimated: 3-4 days)

1. Create base application with authentication
2. Implement chat interface
3. Develop search filters and results display
4. Build user management screens

### Phase 4: Advanced Features and Refinement (Estimated: 2-3 days)

1. Implement conversation summarization
2. Enhance semantic search capabilities
3. Optimize query performance
4. Add additional user preferences

### Phase 5: Testing and Deployment (Estimated: 1-2 days)

1. Comprehensive testing across components
2. Set up deployment pipeline
3. Deploy to production environment
4. Document system for users

## Error Handling

1. **Data Processing Errors**
   - Log malformed JSON entries but continue processing
   - Track statistics on skipped or problematic data
   - Provide admin interface to view processing errors

2. **Search Errors**
   - Implement fallback to keyword search if semantic search fails
   - Show partial results if some components of a complex query fail
   - Clear error messages for users when queries can't be processed

3. **LLM Errors**
   - Handle timeouts and slow responses gracefully
   - Implement circuit breakers to prevent cascading failures
   - Fallback to simpler search functionality if LLM is unavailable

4. **Authentication Errors**
   - Secure error messages that don't leak user information
   - Rate limiting on authentication attempts
   - Account recovery options

## Testing Strategy

### Unit Tests

- Test parsing logic for Slack JSON formats
- Verify embedding generation and storage
- Validate authentication flows
- Test search algorithms with mock data

### Integration Tests

- Test end-to-end search flows
- Verify RAG pipelines with test queries
- Test data loading and indexing processes
- Validate API endpoints with various inputs

### UI Tests

- Test responsive design across devices
- Verify accessibility compliance
- Test chat interface behavior
- Validate form submissions and error states

## Deployment Considerations

### Hardware Requirements

- Minimum 4GB RAM for running the application with a small LLM
- 8GB+ RAM recommended for better performance
- 20GB+ storage for the database, application, and model

### Security

- HTTPS for all connections
- Proper environment variable management
- Regular security updates
- Input validation on all API endpoints

### Monitoring

- Basic logging of system operations
- Error tracking
- Simple usage analytics
- Resource monitoring

## Budget Estimation

### One-time Costs
- Development time (not included in operational costs)

### Monthly Operational Costs
- DigitalOcean Droplet (4GB RAM): $20/month
- Domain name (optional): ~$1/month
- Total estimated monthly cost: $21/month

## Conclusion

This specification outlines a comprehensive plan for developing a Slack Archive RAG System that meets the requirements for searching and interacting with historical Slack conversations. The system balances performance needs with budget constraints, while providing a modern AI-enhanced interface for exploring archived content.

The modular architecture allows for future expansions and model switching, ensuring the system can evolve as needs change or as better LLM options become available.

## Next Steps

1. Set up the initial development environment
2. Begin with the data processing pipeline to validate the approach
3. Implement the core search functionality
4. Develop the user interface
5. Add advanced RAG capabilities
