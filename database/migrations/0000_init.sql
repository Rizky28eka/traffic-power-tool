-- Initial Schema for Traffic Power Tool (MySQL Version)
-- This single file consolidates the entire database schema for clarity and maintainability.

-- Table to store simulation configurations and their top-level results.
CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(255) PRIMARY KEY,
    config JSON NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    stats JSON,
    error_message TEXT,
    
    -- Add a check constraint for status values
    CONSTRAINT status_check CHECK (status IN ('pending', 'starting', 'running', 'completed', 'failed', 'stopping', 'stopped'))
);

-- Table to store data for each individual session within a simulation.
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    persona_name VARCHAR(255),
    device_type VARCHAR(50),
    country VARCHAR(100),
    status VARCHAR(50),
    duration_seconds INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

-- Table to store detailed web performance metrics for pages visited during a session.
CREATE TABLE IF NOT EXISTS web_vitals (
    id CHAR(36) PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    url TEXT NOT NULL,
    ttfb DECIMAL(10, 2),
    fcp DECIMAL(10, 2),
    dom_load DECIMAL(10, 2),
    page_load DECIMAL(10, 2),
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Table for saving and reusing simulation configurations as presets.
CREATE TABLE IF NOT EXISTS presets (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    config JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --- Indexes for Performance Optimization ---

-- Indexes on the simulations table
CREATE INDEX idx_simulations_status ON simulations(status);
CREATE INDEX idx_simulations_created_at ON simulations(created_at DESC);

-- Indexes on the sessions table
CREATE INDEX idx_sessions_simulation_id ON sessions(simulation_id);
-- Composite index for common filtering scenarios
CREATE INDEX idx_sessions_filters ON sessions(simulation_id, persona_name, device_type);

-- Index on the web_vitals table
CREATE INDEX idx_web_vitals_session_id ON web_vitals(session_id);

-- Index on the presets table
CREATE INDEX idx_presets_name ON presets(name);


-- --- Default Data Insertion ---

-- Insert some useful default presets.
-- Using INSERT IGNORE to avoid errors on duplicate names.
INSERT IGNORE INTO presets (name, description, config) VALUES 
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
);