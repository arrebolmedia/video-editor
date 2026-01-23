-- Agregar columnas venue y event_date a la tabla recibos
ALTER TABLE recibos 
ADD COLUMN IF NOT EXISTS venue VARCHAR(255),
ADD COLUMN IF NOT EXISTS event_date DATE;

-- Comentar las columnas
COMMENT ON COLUMN recibos.venue IS 'Lugar/venue donde se realizará el evento';
COMMENT ON COLUMN recibos.event_date IS 'Fecha en que se realizará el evento del cliente';
