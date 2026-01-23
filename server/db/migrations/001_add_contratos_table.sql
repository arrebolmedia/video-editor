-- Crear tabla de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  wedding_date DATE NOT NULL,
  venue VARCHAR(255),
  package_type VARCHAR(100) DEFAULT 'Básico',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  balance_paid BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'draft',
  contract_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_contratos_project ON contratos(project_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_wedding_date ON contratos(wedding_date);
CREATE INDEX IF NOT EXISTS idx_contratos_client_email ON contratos(client_email);
