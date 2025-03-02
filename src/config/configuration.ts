export default () => ({
  // Application
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'raggedy-slacky',
    logging: process.env.DB_LOGGING === 'true',
    autoMigrate: process.env.AUTO_MIGRATE === 'true',
    seedDatabase: process.env.SEED_DATABASE === 'true',
  },
  
  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRATION || '86400', 10), // 24 hours
  },
  
  // Vector Database (Chroma)
  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000', 10),
  },
  
  // LLM Configuration
  llm: {
    provider: process.env.LLM_PROVIDER || 'local',
    model: process.env.LLM_MODEL || 'llama3',
    apiUrl: process.env.LLM_API_URL || 'http://localhost:11434/api',
    apiKey: process.env.LLM_API_KEY || '',
  },
  
  // Data Paths
  paths: {
    slackExport: process.env.SLACK_EXPORT_PATH || './data/slack-archive',
  },
});