-- Initial Schema for Traffic Power Tool
-- This single file consolidates the entire database schema for clarity and maintainability.

-- Best practice: Use transaction to ensure the entire migration succeeds or fails.
BEGIN;

-- Enable UUID generation functionality.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table to store simulation configurations and their top-level results.
CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(255) PRIMARY KEY,
    config JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    stats JSONB,
    error_message TEXT,
    
    -- Add a check constraint for status values
    CONSTRAINT status_check CHECK (status IN ('pending', 'starting', 'running', 'completed', 'failed', 'stopping', 'stopped'))
);

COMMENT ON TABLE simulations IS 'Stores simulation configurations, status, and high-level results.';
COMMENT ON COLUMN simulations.config IS 'The JSON configuration used to run the simulation.';
COMMENT ON COLUMN simulations.stats IS 'Aggregated statistics from the simulation run.';

-- Table to store data for each individual session within a simulation.
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id VARCHAR(255) NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    persona_name VARCHAR(255),
    device_type VARCHAR(50),
    country VARCHAR(100),
    status VARCHAR(50),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE sessions IS 'Records details for each individual user session within a simulation.';

-- Table to store detailed web performance metrics for pages visited during a session.
CREATE TABLE IF NOT EXISTS web_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    ttfb NUMERIC,
    fcp NUMERIC,
    dom_load NUMERIC,
    page_load NUMERIC,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE web_vitals IS 'Stores web performance metrics (vitals) for each page visited.';

-- Table for saving and reusing simulation configurations as presets.
CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE presets IS 'Saves reusable simulation configurations as named presets.';

-- --- Indexes for Performance Optimization ---

-- Indexes on the simulations table
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at DESC);

-- Indexes on the sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_simulation_id ON sessions(simulation_id);
-- Composite index for common filtering scenarios
CREATE INDEX IF NOT EXISTS idx_sessions_filters ON sessions(simulation_id, persona_name, device_type);

-- Index on the web_vitals table
CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);

-- Index on the presets table
CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(name);


-- --- Default Data Insertion ---

-- Insert some useful default presets.
-- Using ON CONFLICT ensures this is safe to run multiple times.
INSERT INTO presets (name, description, config) VALUES 
(
    'Quick Test (50 sessions)',
    'A fast simulation with 50 sessions for quick validation.',
    '{
        "total_sessions": 50,
        "max_concurrent": 10,
        "mode_type": "Bot",
        "headless": true,
        "returning_visitor_rate": 20
    }'
),
(
    'Standard E-commerce Analysis (500 sessions)',
    'A comprehensive test for e-commerce sites with 500 sessions.',
    '{
        "total_sessions": 500,
        "max_concurrent": 25,
        "mode_type": "Human",
        "headless": true,
        "returning_visitor_rate": 45,
        "device_distribution": {"Desktop": 50, "Mobile": 40, "Tablet": 10}
    }'
),
(
    'Global Mobile-First Simulation (1000 sessions)',
    'A large-scale simulation focusing on international mobile users.',
    '{
        "total_sessions": 1000,
        "max_concurrent": 50,
        "mode_type": "Human",
        "headless": true,
        "returning_visitor_rate": 35,
        "device_distribution": {"Desktop": 15, "Mobile": 75, "Tablet": 10}
    }'
)
ON CONFLICT (name) DO NOTHING;

COMMIT;
