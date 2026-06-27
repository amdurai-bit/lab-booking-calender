-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Full-text search configuration for historical English
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS historical_english (COPY = english);
