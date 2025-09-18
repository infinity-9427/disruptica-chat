-- Database initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

-- Connect to the auth_db database
\c auth_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;