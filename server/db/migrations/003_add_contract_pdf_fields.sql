-- Agregar campos necesarios para generación de PDF de contratos
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS coverage_hours INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS photographers_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS videographers_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS photos_quantity VARCHAR(50) DEFAULT '600-700',
ADD COLUMN IF NOT EXISTS deliverables TEXT[], -- Array de entregables
ADD COLUMN IF NOT EXISTS second_payment_date DATE,
ADD COLUMN IF NOT EXISTS travel_expenses BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meals_count INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS special_notes TEXT;
