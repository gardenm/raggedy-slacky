import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1740922929178 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                last_login TIMESTAMP WITH TIME ZONE,
                is_admin BOOLEAN DEFAULT false NOT NULL
            )
        `);

        // Create slack_users table
        await queryRunner.query(`
            CREATE TABLE slack_users (
                id SERIAL PRIMARY KEY,
                slack_user_id VARCHAR(255) NOT NULL UNIQUE,
                username VARCHAR(255) NOT NULL,
                real_name VARCHAR(255),
                avatar VARCHAR(255),
                is_bot BOOLEAN DEFAULT false NOT NULL,
                metadata JSONB
            )
        `);

        // Create channels table
        await queryRunner.query(`
            CREATE TABLE channels (
                id SERIAL PRIMARY KEY,
                slack_channel_id VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                purpose TEXT,
                is_private BOOLEAN NOT NULL,
                is_archived BOOLEAN DEFAULT false NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                metadata JSONB
            )
        `);

        // Create messages table
        await queryRunner.query(`
            CREATE TABLE messages (
                id SERIAL PRIMARY KEY,
                slack_message_id VARCHAR(255) NOT NULL UNIQUE,
                slack_user_id INTEGER NOT NULL REFERENCES slack_users(id),
                channel_id INTEGER NOT NULL REFERENCES channels(id),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                thread_ts VARCHAR(255),
                has_attachments BOOLEAN DEFAULT false NOT NULL,
                content_hash VARCHAR(255),
                reactions JSONB,
                metadata JSONB
            )
        `);

        // Create message_contents table
        await queryRunner.query(`
            CREATE TABLE message_contents (
                id SERIAL PRIMARY KEY,
                message_id INTEGER NOT NULL UNIQUE REFERENCES messages(id),
                raw_content TEXT NOT NULL,
                plain_content TEXT,
                processed_content TEXT
            )
        `);

        // Create attachments table
        await queryRunner.query(`
            CREATE TABLE attachments (
                id SERIAL PRIMARY KEY,
                message_id INTEGER NOT NULL REFERENCES messages(id),
                slack_file_id VARCHAR(255) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                filetype VARCHAR(255) NOT NULL,
                filesize INTEGER,
                url_private VARCHAR(255),
                local_path VARCHAR(255),
                thumbnail_path VARCHAR(255),
                metadata JSONB
            )
        `);

        // Create user_queries table
        await queryRunner.query(`
            CREATE TABLE user_queries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                query TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                results JSONB,
                is_conversational BOOLEAN DEFAULT false NOT NULL,
                session_id VARCHAR(255)
            )
        `);

        // Create conversations table
        await queryRunner.query(`
            CREATE TABLE conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                is_active BOOLEAN DEFAULT true NOT NULL
            )
        `);

        // Create conversation_messages table
        await queryRunner.query(`
            CREATE TABLE conversation_messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER NOT NULL REFERENCES conversations(id),
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                referenced_messages JSONB,
                metadata JSONB
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX idx_messages_slack_user_id ON messages (slack_user_id)`);
        await queryRunner.query(`CREATE INDEX idx_messages_channel_id ON messages (channel_id)`);
        await queryRunner.query(`CREATE INDEX idx_messages_thread_ts ON messages (thread_ts)`);
        await queryRunner.query(`CREATE INDEX idx_messages_timestamp ON messages (timestamp)`);
        await queryRunner.query(`CREATE INDEX idx_user_queries_user_id ON user_queries (user_id)`);
        await queryRunner.query(`CREATE INDEX idx_user_queries_session_id ON user_queries (session_id)`);
        await queryRunner.query(`CREATE INDEX idx_conversations_user_id ON conversations (user_id)`);
        await queryRunner.query(`CREATE INDEX idx_conversations_updated_at ON conversations (updated_at)`);
        await queryRunner.query(`CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages (conversation_id)`);
        await queryRunner.query(`CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages (timestamp)`);
        await queryRunner.query(`CREATE INDEX idx_attachments_message_id ON attachments (message_id)`);
        await queryRunner.query(`CREATE INDEX idx_attachments_slack_file_id ON attachments (slack_file_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS conversation_messages`);
        await queryRunner.query(`DROP TABLE IF EXISTS conversations`);
        await queryRunner.query(`DROP TABLE IF EXISTS user_queries`);
        await queryRunner.query(`DROP TABLE IF EXISTS attachments`);
        await queryRunner.query(`DROP TABLE IF EXISTS message_contents`);
        await queryRunner.query(`DROP TABLE IF EXISTS messages`);
        await queryRunner.query(`DROP TABLE IF EXISTS channels`);
        await queryRunner.query(`DROP TABLE IF EXISTS slack_users`);
        await queryRunner.query(`DROP TABLE IF EXISTS users`);
    }
}
