-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  wedding_date DATE,
  frame_rate INTEGER DEFAULT 24,
  baserow_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  division VARCHAR(50),
  description TEXT,
  planned_duration INTEGER DEFAULT 0,
  is_anchor_moment VARCHAR(20),
  anchor_description TEXT,
  priority VARCHAR(50),
  scene_order INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Versions table
CREATE TABLE IF NOT EXISTS versions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  target_duration_min INTEGER,
  target_duration_max INTEGER,
  actual_duration INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scene references (for versions)
CREATE TABLE IF NOT EXISTS scene_references (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES versions(id) ON DELETE CASCADE,
  scene_id INTEGER REFERENCES scenes(id) ON DELETE CASCADE,
  included BOOLEAN DEFAULT TRUE,
  ref_order INTEGER,
  override_duration INTEGER
);

-- Contratos table
CREATE TABLE IF NOT EXISTS contratos (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_address TEXT,
  wedding_date DATE NOT NULL,
  venue VARCHAR(255),
  venue_address TEXT,
  package_type VARCHAR(100) DEFAULT 'Básico',
  coverage_hours INTEGER DEFAULT 10,
  photographers_count INTEGER DEFAULT 1,
  videographers_count INTEGER DEFAULT 1,
  photos_quantity VARCHAR(50) DEFAULT '600-700',
  deliverables TEXT[],
  total_amount DECIMAL(10, 2) DEFAULT 0,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  second_payment_date DATE,
  travel_expenses BOOLEAN DEFAULT FALSE,
  meals_count INTEGER DEFAULT 3,
  deposit_paid BOOLEAN DEFAULT FALSE,
  balance_paid BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'draft',
  contract_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  special_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recibos table
CREATE TABLE IF NOT EXISTS recibos (
  id SERIAL PRIMARY KEY,
  contrato_id INTEGER REFERENCES contratos(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'Transferencia',
  payment_date DATE NOT NULL,
  concept VARCHAR(100) DEFAULT 'Anticipo',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);
CREATE INDEX IF NOT EXISTS idx_scene_refs_version ON scene_references(version_id);
CREATE INDEX IF NOT EXISTS idx_contratos_project ON contratos(project_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_wedding_date ON contratos(wedding_date);
CREATE INDEX IF NOT EXISTS idx_contratos_client_email ON contratos(client_email);
CREATE INDEX IF NOT EXISTS idx_recibos_contrato ON recibos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_recibos_receipt_number ON recibos(receipt_number);
CREATE INDEX IF NOT EXISTS idx_recibos_payment_date ON recibos(payment_date);
CREATE INDEX IF NOT EXISTS idx_recibos_client_email ON recibos(client_email);
