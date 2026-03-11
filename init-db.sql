-- STP Framework Database Initialization
-- Creates tables for audit logs, billing records, and resource tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audit Logs Table (刑部 - Ministry of Justice)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    resource VARCHAR(255),
    success BOOLEAN NOT NULL,
    error TEXT,
    metadata JSONB,
    ministry VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing Records Table (户部 - Ministry of Revenue)
CREATE TABLE IF NOT EXISTS billing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 6) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    cost DECIMAL(15, 6) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period VARCHAR(20), -- daily, monthly, yearly
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service Registry Table (吏部 - Ministry of Personnel)
CREATE TABLE IF NOT EXISTS service_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    current_load INTEGER DEFAULT 0,
    health_status VARCHAR(50) DEFAULT 'healthy',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource Quotas Table (工部 - Ministry of Works)
CREATE TABLE IF NOT EXISTS resource_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    limit_value DECIMAL(15, 6) NOT NULL,
    used_value DECIMAL(15, 6) DEFAULT 0,
    period VARCHAR(20) NOT NULL, -- daily, monthly, yearly
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_type, period)
);

-- Security Logs Table (兵部 - Ministry of War)
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(255),
    client_ip INET,
    action VARCHAR(255) NOT NULL,
    threat_level VARCHAR(50), -- low, medium, high, critical
    description TEXT,
    blocked BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_timestamp ON billing_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_billing_records_period ON billing_records(period);

CREATE INDEX IF NOT EXISTS idx_service_registry_service_id ON service_registry(service_id);
CREATE INDEX IF NOT EXISTS idx_service_registry_health_status ON service_registry(health_status);

CREATE INDEX IF NOT EXISTS idx_resource_quotas_user_id ON resource_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_quotas_resource_type ON resource_quotas(resource_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_client_ip ON security_logs(client_ip);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_threat_level ON security_logs(threat_level);

-- Create view for ministry dashboard
CREATE OR REPLACE VIEW ministry_dashboard AS
SELECT 
    'audit' as ministry,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN success = true THEN 1 END) as success_count,
    COUNT(CASE WHEN success = false THEN 1 END) as failure_count
FROM audit_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
    'billing' as ministry,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as success_count,
    COUNT(CASE WHEN status != 'paid' THEN 1 END) as failure_count
FROM billing_records
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
    'services' as ministry,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as success_count,
    COUNT(CASE WHEN health_status != 'healthy' THEN 1 END) as failure_count
FROM service_registry
WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
UNION ALL
SELECT 
    'security' as ministry,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN blocked = false THEN 1 END) as success_count,
    COUNT(CASE WHEN blocked = true THEN 1 END) as failure_count
FROM security_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day';

-- Insert default data
INSERT INTO service_registry (service_id, name, endpoint, service_type, capacity, health_status)
VALUES 
    ('api-service-1', 'API Gateway', 'http://api-gateway:8080', 'gateway', 1000, 'healthy'),
    ('auth-service-1', 'Authentication Service', 'http://auth-service:3001', 'auth', 500, 'healthy'),
    ('data-service-1', 'Data Service', 'http://data-service:3002', 'data', 800, 'healthy')
ON CONFLICT (service_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables that need updated_at
CREATE TRIGGER update_service_registry_updated_at 
    BEFORE UPDATE ON service_registry 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_quotas_updated_at 
    BEFORE UPDATE ON resource_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user for reporting (read-only access)
-- Note: In production, you would create a separate user with limited permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'stp_reporting') THEN
        CREATE ROLE stp_reporting WITH LOGIN PASSWORD 'reporting_password' NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
END
$$;

-- Grant read-only permissions to reporting user
GRANT CONNECT ON DATABASE stp TO stp_reporting;
GRANT USAGE ON SCHEMA public TO stp_reporting;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO stp_reporting;

-- Log initialization completion
INSERT INTO audit_logs (request_id, action, success, description)
VALUES ('init-db', 'database_initialization', true, 'STP database initialized successfully');