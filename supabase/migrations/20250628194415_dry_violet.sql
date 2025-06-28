-- Traffic Power Tool Database Schema

-- Enable UUID extension
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

-- Presets table
CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
    simulation_id VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_simulation_id ON sessions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- Insert sample presets
INSERT INTO presets (name, description, config) VALUES 
('E-commerce Test', 'Standard e-commerce website testing', '{"total_sessions": 100, "max_concurrent": 10, "device_distribution": {"Desktop": 60, "Mobile": 35, "Tablet": 5}}'),
('Blog Content Test', 'Content-heavy website testing', '{"total_sessions": 50, "max_concurrent": 5, "device_distribution": {"Desktop": 70, "Mobile": 25, "Tablet": 5}}'),
('Mobile-First Test', 'Mobile-focused testing', '{"total_sessions": 200, "max_concurrent": 15, "device_distribution": {"Desktop": 20, "Mobile": 70, "Tablet": 10}}')
ON CONFLICT (id) DO NOTHING;

COMMIT;