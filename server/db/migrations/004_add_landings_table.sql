-- Create landings table
CREATE TABLE IF NOT EXISTS landings (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  hero_image VARCHAR(500),
  landing_type VARCHAR(50) DEFAULT 'planner',
  adjustment_type VARCHAR(50) DEFAULT 'none',
  adjustment_value DECIMAL(10, 2) DEFAULT 0,
  show_badge BOOLEAN DEFAULT FALSE,
  badge_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default landings
INSERT INTO landings (slug, title, subtitle, hero_image, landing_type, adjustment_type, adjustment_value, show_badge, badge_text) VALUES
  ('colecciones-karen-roberto', 'Karen & Roberto', 'Las Mañanitas, Cuernavaca', '/images/gallery/TOP-PyP-505.webp', 'planner', 'none', 0, false, ''),
  ('colecciones-alejandra-salgado', 'Alejandra Salgado', 'Los Hilos, San Miguel de Allende', '/images/gallery/TOP-PyP-505.webp', 'planner', 'fixed', 30000, false, ''),
  ('colecciones-valeria-meza', 'Valeria Meza', 'Wedding Planner', '/images/gallery/TOP-SyP-324-hero.webp', 'planner', 'percentage', -10, true, 'Descuento especial 10%'),
  ('colecciones-tania-silva', 'Tania Silva', 'Wedding Planner', '/images/gallery/TOP-AyJ-500.webp', 'planner', 'percentage', -15, true, 'Descuento 15%'),
  ('colecciones-sebastian-ramirez', 'Sebastián Ramírez', 'Coordinador de Bodas', '/images/gallery/TOP-CyD-67.webp', 'planner', 'percentage', -12, true, '12% de descuento'),
  ('colecciones-marcela-meza', 'Marcela Meza', 'Wedding Planner', '/images/gallery/TOP-KyB-236.webp', 'planner', 'percentage', -10, true, 'Descuento 10%'),
  ('colecciones-josefo-flores', 'Josefo Flores', 'Event Designer', '/images/gallery/TOP-PyC-312.webp', 'planner', 'fixed', -20000, true, '$20,000 de descuento'),
  ('colecciones-rancho-la-joya', 'Rancho La Joya', 'Venue exclusivo', '/images/RLJ/L&A-363_websize.jpg', 'planner', 'percentage', -10, true, 'Descuento para venue'),
  ('colecciones-club-tabachines', 'Club Tabachines', 'Venue de lujo', '/images/gallery/TOP-SyD-162.webp', 'planner', 'percentage', -15, true, 'Beneficio exclusivo'),
  ('colecciones-josema-gorrosquieta', 'Josema Gorrosquieta', 'Wedding Planner', '/images/gallery/TOP-SyP-116.webp', 'planner', 'percentage', -10, true, '10% de descuento'),
  ('colecciones-the-wedding-partners', 'The Wedding Partners', 'Agencia de Bodas', '/images/gallery/KandE-474.webp', 'planner', 'percentage', -12, true, '12% descuento'),
  ('colecciones-ht-planner', 'HT Planner', 'Wedding Coordination', '/images/gallery/PyP-432.webp', 'planner', 'fixed', -15000, true, '$15,000 de descuento'),
  ('colecciones-paulina', 'Paulia R. Vasconcelos', '14 de noviembre 2026, Mérida', '/images/gallery/TOP-SyP-324-hero.webp', 'client', 'none', 0, false, ''),
  ('colecciones-2026', 'Colecciones 2026', 'Precios especiales', '/images/gallery/SYO-832.webp', 'client', 'percentage', -8, true, 'Promoción 2026'),
  ('colecciones-de-video-2026', 'Colecciones de Video 2026', 'Paquetes de video', '/images/gallery/AyJ-493.webp', 'client', 'none', 0, false, ''),
  ('colecciones-de-foto-2026', 'Colecciones de Foto 2026', 'Paquetes de fotografía', '/images/gallery/CyD-80.webp', 'client', 'none', 0, false, '');

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_landings_slug ON landings(slug);
