-- Add Giovana Sullivan landing page
INSERT INTO landings (slug, title, subtitle, hero_image, landing_type, adjustment_type, adjustment_value, show_badge, badge_text)
VALUES ('colecciones-gio-sullivan', 'Giovana Sullivan', 'Wedding Planner', '/images/gallery/TOP-PyP-505.webp', 'planner', 'percentage', -20, true, '20% DE DESCUENTO')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  hero_image = EXCLUDED.hero_image,
  landing_type = EXCLUDED.landing_type,
  adjustment_type = EXCLUDED.adjustment_type,
  adjustment_value = EXCLUDED.adjustment_value,
  show_badge = EXCLUDED.show_badge,
  badge_text = EXCLUDED.badge_text,
  updated_at = CURRENT_TIMESTAMP;
