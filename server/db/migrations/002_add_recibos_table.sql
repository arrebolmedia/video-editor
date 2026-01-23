-- Crear tabla de recibos
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

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_recibos_contrato ON recibos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_recibos_receipt_number ON recibos(receipt_number);
CREATE INDEX IF NOT EXISTS idx_recibos_payment_date ON recibos(payment_date);
CREATE INDEX IF NOT EXISTS idx_recibos_client_email ON recibos(client_email);
