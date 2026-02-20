-- Migration 007: Add service_type to contratos table
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'both';
