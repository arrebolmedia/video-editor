-- Create database
CREATE DATABASE wedding_planner;

-- Connect to database
\c wedding_planner;

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  wedding_date DATE,
  frame_rate INTEGER DEFAULT 24,
  baserow_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenes table
CREATE TABLE scenes (
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
CREATE TABLE versions (
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
CREATE TABLE scene_references (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES versions(id) ON DELETE CASCADE,
  scene_id INTEGER REFERENCES scenes(id) ON DELETE CASCADE,
  included BOOLEAN DEFAULT TRUE,
  ref_order INTEGER,
  override_duration INTEGER
);

-- Indexes
CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_versions_project ON versions(project_id);
CREATE INDEX idx_scene_refs_version ON scene_references(version_id);
