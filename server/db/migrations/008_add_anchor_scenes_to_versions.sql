-- Agregar campo para guardar el orden de escenas de desarrollo
ALTER TABLE versions
ADD COLUMN IF NOT EXISTS suggested_anchor_scenes JSONB DEFAULT '[]';
