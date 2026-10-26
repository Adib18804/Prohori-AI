-- Initialize Prohori AI database with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Prohori AI Database Initialization Started';
    RAISE NOTICE 'pgvector extension enabled';
END $$;