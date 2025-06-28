-- Initialize database schema for Traffic Power Tool

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(255) PRIMARY KEY,
    config JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
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
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presets table
CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
    simulation_id VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_simulation_id ON sessions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_web_vitals_session_id ON web_vitals(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- Insert default presets
INSERT INTO presets (name, description, config) VALUES 
(
    'Quick Test',
    'Fast simulation for testing purposes',
    '{
        "total_sessions": 50,
        "max_concurrent": 5,
        "mode_type": "Bot",
        "network_type": "Default",
        "returning_visitor_rate": 20
    }'
),
(
    'E-commerce Analysis',
    'Comprehensive e-commerce website testing',
    '{
        "total_sessions": 500,
        "max_concurrent": 20,
        "mode_type": "Human",
        "network_type": "Default",
        "returning_visitor_rate": 40,
        "device_distribution": {"Desktop": 50, "Mobile": 40, "Tablet": 10}
    }'
),
(
    'Global Traffic Simulation',
    'International traffic with diverse demographics',
    '{
        "total_sessions": 1000,
        "max_concurrent": 30,
        "mode_type": "Human",
        "network_type": "Default",
        "returning_visitor_rate": 35,
        "country_distribution": {
            "United States": 20,
            "Indonesia": 15,
            "India": 12,
            "China": 10,
            "Brazil": 8,
            "United Kingdom": 7,
            "Germany": 6,
            "Japan": 6,
            "France": 5,
            "Canada": 5,
            "Others": 6
        }
    }'
)
ON CONFLICT DO NOTHING;