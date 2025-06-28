-- Traffic Power Tool Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(255) PRIMARY KEY,
    config JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    stats JSONB,
    error_message TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id VARCHAR(255) REFERENCES simulations(id) ON DELETE CASCADE,
    persona_name VARCHAR(255),
    device_type VARCHAR(50),
    country VARCHAR(100),
    status VARCHAR(50),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Web vitals table
CREATE TABLE IF NOT EXISTS web_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    ttfb NUMERIC,
    fcp NUMERIC,
    dom_load NUMERIC,
    page_load NUMERIC,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_simulation_id ON sessions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);