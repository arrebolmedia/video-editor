-- Agregar campos para guardar las sugerencias en la tabla versions
ALTER TABLE versions 
ADD COLUMN IF NOT EXISTS suggested_songs JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS suggested_opening_scenes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS suggested_closing_scenes JSONB DEFAULT '[]';
