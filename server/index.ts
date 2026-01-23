import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, useMemoryStorage } from './db/connection.js';
import { defaultWeddingScenes } from './defaultScenes.js';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Error handler for JSON parsing
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse Error:', {
      error: err.message,
      body: req.body,
      rawBody: err.body
    });
    return res.status(400).json({ success: false, error: 'JSON inválido' });
  }
  next();
});

// Disable caching for API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// In-memory storage fallback
const memoryDB: any = {
  projects: [],
  scenes: [],
  versions: [],
  sceneRefs: [],
  contratos: [],
  recibos: [],
  landings: [
    // PLANNERS & VENUES
    { id: 1, slug: 'colecciones-karen-roberto', title: 'Karen & Roberto', subtitle: 'Las Mañanitas, Cuernavaca', hero_image: '/images/gallery/TOP-PyP-505.webp', landing_type: 'planner', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '', created_at: new Date(), updated_at: new Date() },
    { id: 2, slug: 'colecciones-alejandra-salgado', title: 'Alejandra Salgado', subtitle: 'Los Hilos, San Miguel de Allende', hero_image: '/images/gallery/TOP-PyP-505.webp', landing_type: 'planner', adjustment_type: 'fixed', adjustment_value: 30000, show_badge: false, badge_text: '', created_at: new Date(), updated_at: new Date() },
    { id: 3, slug: 'colecciones-valeria-meza', title: 'Valeria Meza', subtitle: 'Wedding Planner', hero_image: '/images/gallery/TOP-SyP-324-hero.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: 'Descuento especial 10%', created_at: new Date(), updated_at: new Date() },
    { id: 4, slug: 'colecciones-tania-silva', title: 'Tania Silva', subtitle: 'Wedding Planner', hero_image: '/images/gallery/TOP-AyJ-500.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -15, show_badge: true, badge_text: 'Descuento 15%', created_at: new Date(), updated_at: new Date() },
    { id: 5, slug: 'colecciones-sebastian-ramirez', title: 'Sebastián Ramírez', subtitle: 'Coordinador de Bodas', hero_image: '/images/gallery/TOP-CyD-67.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -12, show_badge: true, badge_text: '12% de descuento', created_at: new Date(), updated_at: new Date() },
    { id: 6, slug: 'colecciones-marcela-meza', title: 'Marcela Meza', subtitle: 'Wedding Planner', hero_image: '/images/gallery/TOP-KyB-236.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: 'Descuento 10%', created_at: new Date(), updated_at: new Date() },
    { id: 7, slug: 'colecciones-josefo-flores', title: 'Josefo Flores', subtitle: 'Event Designer', hero_image: '/images/gallery/TOP-PyC-312.webp', landing_type: 'planner', adjustment_type: 'fixed', adjustment_value: -20000, show_badge: true, badge_text: '$20,000 de descuento', created_at: new Date(), updated_at: new Date() },
    { id: 8, slug: 'colecciones-rancho-la-joya', title: 'Rancho La Joya', subtitle: 'Venue exclusivo', hero_image: '/images/RLJ/L&A-363_websize.jpg', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: 'Descuento para venue', created_at: new Date(), updated_at: new Date() },
    { id: 9, slug: 'colecciones-club-tabachines', title: 'Club Tabachines', subtitle: 'Venue de lujo', hero_image: '/images/gallery/TOP-SyD-162.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -15, show_badge: true, badge_text: 'Beneficio exclusivo', created_at: new Date(), updated_at: new Date() },
    { id: 10, slug: 'colecciones-josema-gorrosquieta', title: 'Josema Gorrosquieta', subtitle: 'Wedding Planner', hero_image: '/images/gallery/TOP-SyP-116.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: '10% de descuento', created_at: new Date(), updated_at: new Date() },
    { id: 11, slug: 'colecciones-the-wedding-partners', title: 'The Wedding Partners', subtitle: 'Agencia de Bodas', hero_image: '/images/gallery/KandE-474.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -12, show_badge: true, badge_text: '12% descuento', created_at: new Date(), updated_at: new Date() },
    { id: 12, slug: 'colecciones-ht-planner', title: 'HT Planner', subtitle: 'Wedding Coordination', hero_image: '/images/gallery/PyP-432.webp', landing_type: 'planner', adjustment_type: 'fixed', adjustment_value: -15000, show_badge: true, badge_text: '$15,000 de descuento', created_at: new Date(), updated_at: new Date() },
    // CLIENTS
    { id: 13, slug: 'colecciones-paulina', title: 'Paulia R. Vasconcelos', subtitle: '14 de noviembre 2026, Mérida', hero_image: '/images/gallery/TOP-SyP-324-hero.webp', landing_type: 'client', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '', created_at: new Date(), updated_at: new Date() },
    { id: 14, slug: 'colecciones-2026', title: 'Colecciones 2026', subtitle: 'Precios especiales', hero_image: '/images/gallery/SYO-832.webp', landing_type: 'client', adjustment_type: 'percentage', adjustment_value: -8, show_badge: true, badge_text: 'Promoción 2026', created_at: new Date(), updated_at: new Date() },
    { id: 15, slug: 'colecciones-de-video-2026', title: 'Colecciones de Video 2026', subtitle: 'Paquetes de video', hero_image: '/images/gallery/AyJ-493.webp', landing_type: 'client', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '', created_at: new Date(), updated_at: new Date() },
    { id: 16, slug: 'colecciones-de-foto-2026', title: 'Colecciones de Foto 2026', subtitle: 'Paquetes de fotografía', hero_image: '/images/gallery/CyD-80.webp', landing_type: 'client', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '', created_at: new Date(), updated_at: new Date() },
  ],
  users: [
    {
      email: 'anthony@arrebolweddings.com',
      password: process.env.ADMIN_PASSWORD || 'changeme',
      name: 'Anthony Cazares',
      role: 'admin'
    },
    {
      email: 'andrey@arrebolweddings.com',
      password: process.env.EDITOR_PASSWORD || 'changeme',
      name: 'Andrey Luna',
      role: 'editor'
    }
  ]
};

let nextId = 17;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storage: useMemoryStorage ? 'memory' : 'postgresql' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  try {
    console.log('Login request received:', { body: req.body, headers: req.headers });
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }
    
    const user = memoryDB.users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      res.json({
        success: true,
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Get users (editors only)
app.get('/api/users', (req, res) => {
  const editors = memoryDB.users.filter((u: any) => u.role === 'editor' || u.role === 'admin').map((u: any) => ({
    email: u.email,
    name: u.name
  }));
  res.json(editors);
});

// Sync projects from Baserow
app.post('/api/sync/baserow', async (req, res) => {
  try {
    const baserowToken = process.env.BASEROW_TOKEN;
    const baserowUrl = process.env.BASEROW_URL || 'https://data.arrebolweddings.com';
    
    if (!baserowToken) {
      return res.status(500).json({ error: 'Baserow token not configured' });
    }

    // Fetch only "Cerrado-ganado" projects from 2025 onwards
    // We'll fetch in batches since Baserow has pagination
    let allProjects: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${baserowUrl}/api/database/rows/table/34/?user_field_names=true&size=200&page=${page}`, {
        headers: {
          'Authorization': `Token ${baserowToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Baserow fetch error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to fetch from Baserow', details: errorText });
      }

      const data = await response.json();
      allProjects = allProjects.concat(data.results || []);
      hasMore = data.next !== null;
      page++;
    }

    // Filter: Status = "Cerrado-ganado" AND Fecha del Evento >= 2025-01-01
    const projects = allProjects.filter((row: any) => {
      const status = row.Status?.value;
      const weddingDate = row['Fecha del Evento'];
      
      // Check for various status formats (Cerrado-ganado, Cerrado–ganado, etc.)
      if (!status || !status.toLowerCase().includes('cerrado') || !status.toLowerCase().includes('ganado')) {
        return false;
      }
      if (!weddingDate) return false;
      
      const eventDate = new Date(weddingDate);
      const cutoffDate = new Date('2025-01-01');
      
      return eventDate >= cutoffDate;
    });
    
    let syncedCount = 0;
    let errors = [];
    let skippedCount = 0;

    if (useMemoryStorage) {
      // Memory storage
      for (const row of projects) {
        try {
          const existing = memoryDB.projects.find((p: any) => p.baserow_id === row.id);
          
          if (!existing) {
            const weddingDate = row['Fecha del Evento'] || null;
            const projectName = row['Nombre'] || 'Sin nombre';

            // Asignar proyectos específicos a Andrey
            let assignedTo = null;
            if (projectName === 'Tanya & Eder' || projectName === 'Dulce & Jorge' || projectName === 'Paulina & Rogelio') {
              assignedTo = 'andrey@arrebolweddings.com';
            }

            const projectId = nextId++;
            memoryDB.projects.push({
              id: projectId,
              name: projectName,
              wedding_date: weddingDate,
              baserow_id: row.id,
              frame_rate: 24,
              assigned_to: assignedTo,
              created_at: new Date(),
              updated_at: new Date()
            });
            
            // Add default wedding scenes
            for (let i = 0; i < defaultWeddingScenes.length; i++) {
              const sceneData = defaultWeddingScenes[i];
              memoryDB.scenes.push({
                id: nextId++,
                project_id: projectId,
                name: sceneData.name,
                division: sceneData.division,
                description: sceneData.description,
                planned_duration: sceneData.planned_duration,
                actual_duration: null,
                is_anchor_moment: sceneData.is_anchor_moment,
                anchor_description: sceneData.anchor_description,
                priority: sceneData.priority,
                scene_order: i,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
            
            // Add default versions (Teaser, Highlights, Full)
            const defaultVersions = [
              { name: 'Teaser', type: 'short', target_duration_min: 55, target_duration_max: 65, description: 'Versión corta de 60 segundos' },
              { name: 'Highlights', type: 'medium', target_duration_min: 180, target_duration_max: 300, description: 'Highlights de 5 minutos' },
              { name: 'Full', type: 'long', target_duration_min: 1080, target_duration_max: 1320, description: 'Video completo de 18-22 minutos' }
            ];
            
            for (const versionData of defaultVersions) {
              memoryDB.versions.push({
                id: nextId++,
                project_id: projectId,
                name: versionData.name,
                type: versionData.type,
                target_duration_min: versionData.target_duration_min,
                target_duration_max: versionData.target_duration_max,
                description: versionData.description,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
            
            syncedCount++;
          } else {
            skippedCount++;
          }
        } catch (err: any) {
          errors.push({ row_id: row.id, error: err.message });
        }
      }
    } else {
      // PostgreSQL storage
      for (const row of projects) {
        try {
          const existing = await pool.query(
            'SELECT id FROM projects WHERE baserow_id = $1',
            [row.id]
          );

          if (existing.rows.length === 0) {
            const weddingDate = row['Fecha del Evento'] || null;
            const projectName = row['Nombre'] || 'Sin nombre';

            const projectResult = await pool.query(
              `INSERT INTO projects (name, wedding_date, baserow_id, frame_rate, 
                save_the_date_photo, wedding_day_photo, save_the_date_video, 
                wedding_day_video, highlights_video, teaser_video, photobook) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
              [
                projectName, 
                weddingDate, 
                row.id, 
                24,
                row['Save The Date 📸']?.value || null,
                row['Wedding Day 📸']?.value || null,
                row['Save The Date 📥']?.value || null,
                row['Wedding Day 📥']?.value || null,
                row['Highlights 📥']?.value || null,
                row['Teaser 📥']?.value || null,
                row['Photobook']?.value || null
              ]
            );
            
            const projectId = projectResult.rows[0].id;
            
            // Insert default wedding scenes
            const sceneIds: number[] = [];
            for (let i = 0; i < defaultWeddingScenes.length; i++) {
              const sceneData = defaultWeddingScenes[i];
              const sceneResult = await pool.query(
                'INSERT INTO scenes (project_id, name, division, description, planned_duration, is_anchor_moment, anchor_description, priority, scene_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                [projectId, sceneData.name, sceneData.division, sceneData.description, sceneData.planned_duration, sceneData.is_anchor_moment, sceneData.anchor_description, sceneData.priority, i]
              );
              sceneIds.push(sceneResult.rows[0].id);
            }
            
            // Create 3 default versions
            const versions = [
              { name: 'Teaser', type: 'short', target_duration_min: 55, target_duration_max: 65 },
              { name: 'Highlights', type: 'medium', target_duration_min: 180, target_duration_max: 300 },
              { name: 'Full', type: 'long', target_duration_min: 1800, target_duration_max: 3600 }
            ];
            
            for (const versionData of versions) {
              const versionResult = await pool.query(
                'INSERT INTO versions (project_id, name, type, target_duration_min, target_duration_max) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [projectId, versionData.name, versionData.type, versionData.target_duration_min, versionData.target_duration_max]
              );
              
              // For Completo version, add all scenes
              if (versionData.type === 'long') {
                for (let i = 0; i < sceneIds.length; i++) {
                  await pool.query(
                    'INSERT INTO scene_references (version_id, scene_id, included, ref_order) VALUES ($1, $2, $3, $4)',
                    [versionResult.rows[0].id, sceneIds[i], true, i]
                  );
                }
              }
            }
            
            syncedCount++;
          } else {
            skippedCount++;
          }
        } catch (err: any) {
          errors.push({ row_id: row.id, error: err.message });
        }
      }
    }

    console.log(`Baserow sync completed: ${syncedCount} new projects from ${projects.length} filtered (Cerrado-ganado desde 2025)`);
    res.json({ 
      success: true, 
      synced: syncedCount,
      skipped: skippedCount,
      total: projects.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error syncing with Baserow:', error);
    res.status(500).json({ error: 'Error syncing with Baserow', message: error.message });
  }
});

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const userEmail = req.query.user as string;
    const userRole = req.query.role as string;
    
    if (useMemoryStorage) {
      let projects = memoryDB.projects;
      
      // Si es editor, solo mostrar proyectos asignados
      if (userRole === 'editor' && userEmail) {
        projects = projects.filter((p: any) => p.assigned_to === userEmail);
      }
      
      res.json(projects);
    } else {
      let query = 'SELECT * FROM projects';
      const params: any[] = [];
      
      if (userRole === 'editor' && userEmail) {
        query += ' WHERE assigned_to = $1';
        params.push(userEmail);
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, wedding_date, frame_rate } = req.body;
    
    if (useMemoryStorage) {
      const project = {
        id: nextId++,
        name,
        wedding_date,
        frame_rate: frame_rate || 24,
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryDB.projects.push(project);
      
      // Insert default wedding scenes
      const sceneIds: number[] = [];
      defaultWeddingScenes.forEach((sceneData, index) => {
        const sceneId = nextId++;
        sceneIds.push(sceneId);
        memoryDB.scenes.push({
          id: sceneId,
          project_id: project.id,
          scene_order: index,
          ...sceneData,
          created_at: new Date().toISOString()
        });
      });
      
      // Create 3 default versions
      const versions = [
        { name: 'Teaser', type: 'short', target_duration_min: 55, target_duration_max: 65 },
        { name: 'Highlights', type: 'medium', target_duration_min: 180, target_duration_max: 300 },
        { name: 'Full', type: 'long', target_duration_min: 1800, target_duration_max: 3600 }
      ];
      
      let completoVersionId: number | null = null;
      versions.forEach(versionData => {
        const versionId = nextId++;
        memoryDB.versions.push({
          id: versionId,
          project_id: project.id,
          ...versionData,
          actual_duration: 0,
          created_at: new Date().toISOString()
        });
        
        // For Completo version, add all scenes
        if (versionData.type === 'long') {
          completoVersionId = versionId;
          sceneIds.forEach((sceneId, index) => {
            memoryDB.sceneRefs.push({
              id: nextId++,
              version_id: versionId,
              scene_id: sceneId,
              included: true,
              ref_order: index,
              override_duration: null
            });
          });
        }
      });
      
      res.json(project);
    } else {
      const result = await pool.query(
        'INSERT INTO projects (name, wedding_date, frame_rate) VALUES ($1, $2, $3) RETURNING *',
        [name, wedding_date, frame_rate || 24]
      );
      const project = result.rows[0];
      
      // Insert default wedding scenes
      const sceneIds: number[] = [];
      for (let i = 0; i < defaultWeddingScenes.length; i++) {
        const sceneData = defaultWeddingScenes[i];
        const sceneResult = await pool.query(
          'INSERT INTO scenes (project_id, name, division, description, planned_duration, is_anchor_moment, anchor_description, priority, scene_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [project.id, sceneData.name, sceneData.division, sceneData.description, sceneData.planned_duration, sceneData.is_anchor_moment, sceneData.anchor_description, sceneData.priority, i]
        );
        sceneIds.push(sceneResult.rows[0].id);
      }
      
      // Create 3 default versions
      const versions = [
        { name: 'Teaser', type: 'short', target_duration_min: 55, target_duration_max: 65 },
        { name: 'Highlights', type: 'medium', target_duration_min: 180, target_duration_max: 300 },
        { name: 'Full', type: 'long', target_duration_min: 1800, target_duration_max: 3600 }
      ];
      
      for (const versionData of versions) {
        const versionResult = await pool.query(
          'INSERT INTO versions (project_id, name, type, target_duration_min, target_duration_max) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [project.id, versionData.name, versionData.type, versionData.target_duration_min, versionData.target_duration_max]
        );
        
        // For Completo version, add all scenes
        if (versionData.type === 'long') {
          for (let i = 0; i < sceneIds.length; i++) {
            await pool.query(
              'INSERT INTO scene_references (version_id, scene_id, included, ref_order) VALUES ($1, $2, $3, $4)',
              [versionResult.rows[0].id, sceneIds[i], true, i]
            );
          }
        }
      }
      
      res.json(project);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error creating project' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (useMemoryStorage) {
      const project = memoryDB.projects.find((p: any) => p.id === id);
      res.json(project || null);
    } else {
      const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      res.json(result.rows[0] || null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, wedding_date } = req.body;
    
    if (useMemoryStorage) {
      const project = memoryDB.projects.find((p: any) => p.id === id);
      if (project) {
        project.name = name;
        project.wedding_date = wedding_date;
        project.updated_at = new Date().toISOString();
        res.json(project);
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } else {
      const result = await pool.query(
        'UPDATE projects SET name = $1, wedding_date = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [name, wedding_date, id]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating project' });
  }
});

// Assign editor to project
app.put('/api/projects/:id/assign', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { assigned_to } = req.body;
    
    if (useMemoryStorage) {
      const project = memoryDB.projects.find((p: any) => p.id === id);
      if (project) {
        project.assigned_to = assigned_to;
        project.updated_at = new Date().toISOString();
        res.json(project);
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } else {
      const result = await pool.query(
        'UPDATE projects SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [assigned_to, id]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error assigning project' });
  }
});

// Scenes
app.get('/api/projects/:projectId/scenes', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    if (useMemoryStorage) {
      const scenes = memoryDB.scenes.filter((s: any) => s.project_id === projectId);
      res.json(scenes);
    } else {
      const result = await pool.query(
        'SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_order',
        [projectId]
      );
      res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching scenes' });
  }
});

app.post('/api/scenes', async (req, res) => {
  try {
    const { project_id, name, division, description, planned_duration, is_anchor_moment, anchor_description, priority, scene_order } = req.body;
    
    if (useMemoryStorage) {
      const scene = {
        id: nextId++,
        project_id,
        name,
        division,
        description,
        planned_duration: planned_duration || 0,
        is_anchor_moment,
        anchor_description,
        priority,
        scene_order,
        created_at: new Date().toISOString()
      };
      memoryDB.scenes.push(scene);
      res.json(scene);
    } else {
      const result = await pool.query(
        'INSERT INTO scenes (project_id, name, division, description, planned_duration, is_anchor_moment, anchor_description, priority, scene_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [project_id, name, division, description, planned_duration || 0, is_anchor_moment, anchor_description, priority, scene_order]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error creating scene' });
  }
});

app.put('/api/scenes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, division, description, planned_duration, is_anchor_moment, anchor_description, priority } = req.body;
    
    if (useMemoryStorage) {
      const scene = memoryDB.scenes.find((s: any) => s.id === id);
      if (scene) {
        Object.assign(scene, { name, division, description, planned_duration, is_anchor_moment, anchor_description, priority });
        res.json(scene);
      } else {
        res.status(404).json({ error: 'Scene not found' });
      }
    } else {
      const result = await pool.query(
        'UPDATE scenes SET name = $1, division = $2, description = $3, planned_duration = $4, is_anchor_moment = $5, anchor_description = $6, priority = $7 WHERE id = $8 RETURNING *',
        [name, division, description, planned_duration, is_anchor_moment, anchor_description, priority, id]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating scene' });
  }
});

app.patch('/api/scenes/reorder', async (req, res) => {
  try {
    const { scenes } = req.body; // Array of { id, scene_order }
    
    if (useMemoryStorage) {
      scenes.forEach((update: any) => {
        const scene = memoryDB.scenes.find((s: any) => s.id === update.id);
        if (scene) scene.scene_order = update.scene_order;
      });
      res.json({ success: true });
    } else {
      for (const update of scenes) {
        await pool.query('UPDATE scenes SET scene_order = $1 WHERE id = $2', [update.scene_order, update.id]);
      }
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error reordering scenes' });
  }
});

// Versions
app.get('/api/projects/:projectId/versions', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    if (useMemoryStorage) {
      const versions = memoryDB.versions.filter((v: any) => v.project_id === projectId);
      res.json(versions);
    } else {
      const result = await pool.query(
        'SELECT * FROM versions WHERE project_id = $1',
        [projectId]
      );
      res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching versions' });
  }
});

app.post('/api/versions', async (req, res) => {
  try {
    const { project_id, name, type, target_duration_min, target_duration_max } = req.body;
    
    if (useMemoryStorage) {
      const version = {
        id: nextId++,
        project_id,
        name,
        type,
        target_duration_min,
        target_duration_max,
        actual_duration: 0,
        created_at: new Date().toISOString()
      };
      memoryDB.versions.push(version);
      res.json(version);
    } else {
      const result = await pool.query(
        'INSERT INTO versions (project_id, name, type, target_duration_min, target_duration_max) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [project_id, name, type, target_duration_min, target_duration_max]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error creating version' });
  }
});

// Scene References (version-scene associations)
app.get('/api/versions/:versionId/scenes', async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId);
    
    if (useMemoryStorage) {
      const refs = memoryDB.sceneRefs.filter((r: any) => r.version_id === versionId && r.included);
      const sceneIds = refs.map((r: any) => r.scene_id);
      res.json(sceneIds);
    } else {
      const result = await pool.query(
        'SELECT scene_id FROM scene_references WHERE version_id = $1 AND included = true ORDER BY ref_order',
        [versionId]
      );
      res.json(result.rows.map(row => row.scene_id));
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching version scenes' });
  }
});

app.post('/api/versions/:versionId/scenes', async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId);
    const { sceneIds } = req.body; // Array of scene IDs to include
    
    if (useMemoryStorage) {
      // Remove all existing refs for this version
      memoryDB.sceneRefs = memoryDB.sceneRefs.filter((r: any) => r.version_id !== versionId);
      
      // Add new refs
      sceneIds.forEach((sceneId: number, index: number) => {
        memoryDB.sceneRefs.push({
          id: nextId++,
          version_id: versionId,
          scene_id: sceneId,
          included: true,
          ref_order: index,
          override_duration: null
        });
      });
      
      res.json({ success: true });
    } else {
      // Remove all existing refs for this version
      await pool.query('DELETE FROM scene_references WHERE version_id = $1', [versionId]);
      
      // Add new refs
      for (let i = 0; i < sceneIds.length; i++) {
        await pool.query(
          'INSERT INTO scene_references (version_id, scene_id, included, ref_order) VALUES ($1, $2, $3, $4)',
          [versionId, sceneIds[i], true, i]
        );
      }
      
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error saving version scenes' });
  }
});

// Save version suggestions
app.post('/api/versions/:versionId/suggestions', async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId);
    const { songs, openingScenes, closingScenes } = req.body;
    
    if (useMemoryStorage) {
      const version = memoryDB.versions.find((v: any) => v.id === versionId);
      if (version) {
        version.suggested_songs = songs || [];
        version.suggested_opening_scenes = openingScenes || [];
        version.suggested_closing_scenes = closingScenes || [];
      }
      res.json({ success: true });
    } else {
      await pool.query(
        'UPDATE versions SET suggested_songs = $1, suggested_opening_scenes = $2, suggested_closing_scenes = $3 WHERE id = $4',
        [JSON.stringify(songs || []), JSON.stringify(openingScenes || []), JSON.stringify(closingScenes || []), versionId]
      );
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error saving suggestions:', error);
    res.status(500).json({ error: 'Error saving suggestions' });
  }
});

// Update version status
app.patch('/api/versions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (useMemoryStorage) {
      const version = memoryDB.versions.find((v: any) => v.id === parseInt(id));
      if (version) {
        version.status = status;
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Version not found' });
      }
    } else {
      // Update local database
      await pool.query('UPDATE versions SET status = $1 WHERE id = $2', [status, id]);
      
      // Get version info to sync with Baserow
      const versionResult = await pool.query(
        'SELECT v.*, p.baserow_id, p.name as project_name FROM versions v JOIN projects p ON v.project_id = p.id WHERE v.id = $1',
        [id]
      );
      
      if (versionResult.rows.length > 0) {
        const version = versionResult.rows[0];
        
        // Sync with Baserow if baserow_id exists
        if (version.baserow_id) {
          const baserowToken = process.env.BASEROW_TOKEN || 'QesJPA7OcCn5Y2i3cAQhKD6sAnRRi9mE';
          const baserowUrl = process.env.BASEROW_URL || 'https://data.arrebolweddings.com';
          
          // Map version type to Baserow field
          const fieldMap: Record<string, string> = {
            'short': 'Teaser 🎥',
            'medium': 'Highlights 🎥',
            'long': 'Wedding Day 🎥'
          };
          
          const fieldName = fieldMap[version.type];
          if (fieldName) {
            try {
              const response = await fetch(`${baserowUrl}/api/database/rows/table/34/${version.baserow_id}/?user_field_names=true`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Token ${baserowToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  [fieldName]: status
                })
              });
              
              if (!response.ok) {
                console.error('Failed to sync with Baserow:', await response.text());
              }
            } catch (syncError) {
              console.error('Error syncing with Baserow:', syncError);
            }
          }
        }
        
        res.json({ success: true, version });
      } else {
        res.status(404).json({ error: 'Version not found' });
      }
    }
  } catch (error) {
    console.error('Error updating version status:', error);
    res.status(500).json({ error: 'Error updating version status' });
  }
});

// Delete all projects
app.delete('/api/projects/all', async (req, res) => {
  try {
    if (useMemoryStorage) {
      // Clear memory storage
      memoryDB.projects = [];
      memoryDB.scenes = [];
      memoryDB.versions = [];
      memoryDB.sceneRefs = [];
      nextId = 1;
      res.json({ success: true, message: 'All projects deleted from memory storage' });
    } else {
      // PostgreSQL - delete all projects (cascades to scenes, versions, scene_references)
      const result = await pool.query('DELETE FROM projects');
      res.json({ success: true, message: `Deleted ${result.rowCount} projects`, count: result.rowCount });
    }
  } catch (error) {
    console.error('Error deleting all projects:', error);
    res.status(500).json({ error: 'Error deleting all projects' });
  }
});

// Auto-sync past weddings (bodas cuya fecha ya pasó)
app.post('/api/sync/past-weddings', async (req, res) => {
  try {
    const baserowToken = process.env.BASEROW_TOKEN;
    const baserowUrl = process.env.BASEROW_URL || 'https://data.arrebolweddings.com';
    
    if (!baserowToken) {
      return res.status(500).json({ error: 'Baserow token not configured' });
    }

    // Fetch all projects from Baserow
    let allProjects: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${baserowUrl}/api/database/rows/table/34/?user_field_names=true&size=200&page=${page}`, {
        headers: {
          'Authorization': `Token ${baserowToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ error: 'Failed to fetch from Baserow', details: errorText });
      }

      const data = await response.json();
      allProjects = allProjects.concat(data.results || []);
      hasMore = data.next !== null;
      page++;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter: Status = "Cerrado-ganado", >= 2025, and wedding date has passed
    const pastWeddings = allProjects.filter((row: any) => {
      const status = row.Status?.value;
      const weddingDate = row['Fecha del Evento'];
      
      // Check for various status formats
      if (!status || !status.toLowerCase().includes('cerrado') || !status.toLowerCase().includes('ganado')) {
        return false;
      }
      if (!weddingDate) return false;
      
      const eventDate = new Date(weddingDate);
      const cutoffDate = new Date('2025-01-01');
      
      return eventDate >= cutoffDate && eventDate < today;
    });
    
    let syncedCount = 0;
    let skippedCount = 0;
    let errors = [];

    if (useMemoryStorage) {
      for (const row of pastWeddings) {
        try {
          const existing = memoryDB.projects.find((p: any) => p.baserow_id === row.id);
          
          if (!existing) {
            const weddingDate = row['Fecha del Evento'];
            const projectName = row['Nombre'] || 'Sin nombre';

            memoryDB.projects.push({
              id: nextId++,
              name: projectName,
              wedding_date: weddingDate,
              baserow_id: row.id,
              frame_rate: 24,
              created_at: new Date(),
              updated_at: new Date()
            });
            syncedCount++;
          } else {
            skippedCount++;
          }
        } catch (err: any) {
          errors.push({ row_id: row.id, error: err.message });
        }
      }
    } else {
      for (const row of pastWeddings) {
        try {
          const existing = await pool.query(
            'SELECT id FROM projects WHERE baserow_id = $1',
            [row.id]
          );

          if (existing.rows.length === 0) {
            const weddingDate = row['Fecha del Evento'];
            const projectName = row['Nombre'] || 'Sin nombre';

            await pool.query(
              'INSERT INTO projects (name, wedding_date, baserow_id, frame_rate) VALUES ($1, $2, $3, $4)',
              [projectName, weddingDate, row.id, 24]
            );
            syncedCount++;
          } else {
            skippedCount++;
          }
        } catch (err: any) {
          errors.push({ row_id: row.id, error: err.message });
        }
      }
    }

    console.log(`Past weddings sync: ${syncedCount} new projects from ${pastWeddings.length} past weddings`);
    res.json({ 
      success: true, 
      synced: syncedCount,
      skipped: skippedCount,
      total: pastWeddings.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error syncing past weddings:', error);
    res.status(500).json({ error: 'Error syncing past weddings', message: error.message });
  }
});

// Endpoint para agregar escenas por defecto a un proyecto que no las tenga
app.post('/api/projects/:projectId/initialize-scenes', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    if (useMemoryStorage) {
      // Verificar si el proyecto ya tiene escenas
      const existingScenes = memoryDB.scenes.filter((s: any) => s.project_id === projectId);
      
      if (existingScenes.length > 0) {
        return res.json({ success: true, message: 'El proyecto ya tiene escenas', scenes: existingScenes.length });
      }
      
      // Agregar escenas por defecto
      const sceneIds: number[] = [];
      defaultWeddingScenes.forEach((sceneData, index) => {
        const sceneId = nextId++;
        sceneIds.push(sceneId);
        memoryDB.scenes.push({
          id: sceneId,
          project_id: projectId,
          scene_order: index,
          ...sceneData,
          created_at: new Date().toISOString()
        });
      });
      
      // Verificar si el proyecto tiene versiones, si no, crearlas
      const existingVersions = memoryDB.versions.filter((v: any) => v.project_id === projectId);
      
      if (existingVersions.length === 0) {
        const versions = [
          { name: 'Teaser', type: 'short', target_duration_min: 55, target_duration_max: 65 },
          { name: 'Highlights', type: 'medium', target_duration_min: 180, target_duration_max: 300 },
          { name: 'Full', type: 'long', target_duration_min: 1800, target_duration_max: 3600 }
        ];
        
        versions.forEach(versionData => {
          const versionId = nextId++;
          memoryDB.versions.push({
            id: versionId,
            project_id: projectId,
            ...versionData,
            actual_duration: 0,
            created_at: new Date().toISOString()
          });
          
          // Para la versión Full, agregar todas las escenas
          if (versionData.type === 'long') {
            sceneIds.forEach((sceneId, idx) => {
              memoryDB.sceneRefs.push({
                id: nextId++,
                version_id: versionId,
                scene_id: sceneId,
                included: true,
                ref_order: idx
              });
            });
          }
        });
      }
      
      res.json({ success: true, scenes: sceneIds.length, message: 'Escenas y versiones inicializadas' });
    } else {
      // PostgreSQL - similar lógica
      const existing = await pool.query('SELECT COUNT(*) FROM scenes WHERE project_id = $1', [projectId]);
      
      if (parseInt(existing.rows[0].count) > 0) {
        return res.json({ success: true, message: 'El proyecto ya tiene escenas', scenes: existing.rows[0].count });
      }
      
      const sceneIds: number[] = [];
      for (let i = 0; i < defaultWeddingScenes.length; i++) {
        const sceneData = defaultWeddingScenes[i];
        const result = await pool.query(
          'INSERT INTO scenes (project_id, name, division, description, planned_duration, is_anchor_moment, anchor_description, priority, scene_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [projectId, sceneData.name, sceneData.division, sceneData.description, sceneData.planned_duration, sceneData.is_anchor_moment, sceneData.anchor_description, sceneData.priority, i]
        );
        sceneIds.push(result.rows[0].id);
      }
      
      res.json({ success: true, scenes: sceneIds.length });
    }
  } catch (error) {
    console.error('Error initializing scenes:', error);
    res.status(500).json({ error: 'Error initializing scenes' });
  }
});

// ============================================
// LANDINGS ENDPOINTS
// ============================================

// Get all landings
app.get('/api/landings', async (req, res) => {
  if (useMemoryStorage) {
    const landings = memoryDB.landings || [];
    res.json(landings);
  } else {
    try {
      const result = await pool.query('SELECT * FROM landings ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching landings:', error);
      res.status(500).json({ error: 'Error fetching landings' });
    }
  }
});

// Create landing
app.post('/api/landings', async (req, res) => {
  const { slug, title, subtitle, hero_image, adjustment_type, adjustment_value, show_badge, badge_text, landing_type } = req.body;
  
  if (useMemoryStorage) {
    if (!memoryDB.landings) memoryDB.landings = [];
    const newLanding = {
      id: nextId++,
      slug,
      title,
      subtitle,
      hero_image,
      adjustment_type: adjustment_type || 'none',
      adjustment_value: adjustment_value || 0,
      show_badge: show_badge || false,
      badge_text: badge_text || '',
      landing_type: landing_type || 'client',
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryDB.landings.push(newLanding);
    res.json(newLanding);
  } else {
    try {
      const result = await pool.query(
        `INSERT INTO landings (slug, title, subtitle, hero_image, adjustment_type, adjustment_value, show_badge, badge_text, landing_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [slug, title, subtitle, hero_image, adjustment_type || 'none', adjustment_value || 0, show_badge || false, badge_text || '', landing_type || 'client']
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating landing:', error);
      res.status(500).json({ error: 'Error creating landing' });
    }
  }
});

// Update landing
app.put('/api/landings/:id', async (req, res) => {
  const { id } = req.params;
  const { slug, title, subtitle, hero_image, adjustment_type, adjustment_value, show_badge, badge_text, landing_type } = req.body;
  
  if (useMemoryStorage) {
    if (!memoryDB.landings) memoryDB.landings = [];
    const index = memoryDB.landings.findIndex((l: any) => l.id === parseInt(id));
    if (index !== -1) {
      memoryDB.landings[index] = {
        ...memoryDB.landings[index],
        slug,
        title,
        subtitle,
        hero_image,
        adjustment_type,
        adjustment_value,
        show_badge,
        badge_text,
        landing_type,
        updated_at: new Date()
      };
      res.json(memoryDB.landings[index]);
    } else {
      res.status(404).json({ error: 'Landing not found' });
    }
  } else {
    try {
      const result = await pool.query(
        `UPDATE landings SET slug = $1, title = $2, subtitle = $3, hero_image = $4, 
         adjustment_type = $5, adjustment_value = $6, show_badge = $7, badge_text = $8, 
         landing_type = $9, updated_at = NOW() WHERE id = $10 RETURNING *`,
        [slug, title, subtitle, hero_image, adjustment_type, adjustment_value, show_badge, badge_text, landing_type, id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Landing not found' });
      } else {
        res.json(result.rows[0]);
      }
    } catch (error) {
      console.error('Error updating landing:', error);
      res.status(500).json({ error: 'Error updating landing' });
    }
  }
});

// Delete landing
app.delete('/api/landings/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMemoryStorage) {
    if (!memoryDB.landings) memoryDB.landings = [];
    const index = memoryDB.landings.findIndex((l: any) => l.id === parseInt(id));
    if (index !== -1) {
      memoryDB.landings.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Landing not found' });
    }
  } else {
    try {
      const result = await pool.query('DELETE FROM landings WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Landing not found' });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      console.error('Error deleting landing:', error);
      res.status(500).json({ error: 'Error deleting landing' });
    }
  }
});

// Seed landings with default data
app.post('/api/landings/seed', async (req, res) => {
  const defaultLandings = [
    // PLANNERS & VENUES
    { slug: 'colecciones-karen-roberto', title: 'Karen & Roberto', subtitle: 'Las Mañanitas, Cuernavaca', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-PyP-505.webp', landing_type: 'planner', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '' },
    { slug: 'colecciones-alejandra-salgado', title: 'Alejandra Salgado', subtitle: 'Los Hilos, San Miguel de Allende', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-PyP-505.webp', landing_type: 'planner', adjustment_type: 'fixed', adjustment_value: 30000, show_badge: false, badge_text: '' },
    { slug: 'colecciones-valeria-meza', title: 'Valeria Meza', subtitle: 'Wedding Planner', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-SyP-324-hero.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: 'Descuento especial 10%' },
    { slug: 'colecciones-tania-silva', title: 'Tania Silva', subtitle: 'Wedding Planner', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-AyJ-500.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -15, show_badge: true, badge_text: 'Descuento 15%' },
    { slug: 'colecciones-sebastian-ramirez', title: 'Sebastián Ramírez', subtitle: 'Coordinador de Bodas', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-CyD-67.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -12, show_badge: true, badge_text: '12% de descuento' },
    { slug: 'colecciones-marcela-meza', title: 'Marcela Meza', subtitle: 'Wedding Planner', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-KyB-236.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: 'Descuento 10%' },
    { slug: 'colecciones-josefo-flores', title: 'Josefo Flores', subtitle: 'Event Designer', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-PyC-312.webp', landing_type: 'planner', adjustment_type: 'fixed', adjustment_value: -20000, show_badge: true, badge_text: '$20,000 de descuento' },
    { slug: 'colecciones-rancho-la-joya', title: 'Rancho La Joya', subtitle: 'Venue exclusivo', hero_image: 'https://arrebolweddings.com/images/RLJ/L&A-363_websize.jpg', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: 'Descuento para venue' },
    { slug: 'colecciones-club-tabachines', title: 'Club Tabachines', subtitle: 'Venue de lujo', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-SyD-162.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -15, show_badge: true, badge_text: 'Beneficio exclusivo' },
    { slug: 'colecciones-josema-gorrosquieta', title: 'Josema Gorrosquieta', subtitle: 'Wedding Planner', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-SyP-116.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -10, show_badge: true, badge_text: '10% de descuento' },
    { slug: 'colecciones-the-wedding-partners', title: 'The Wedding Partners', subtitle: 'Agencia de Bodas', hero_image: 'https://arrebolweddings.com/images/gallery/KandE-474.webp', landing_type: 'planner', adjustment_type: 'percentage', adjustment_value: -12, show_badge: true, badge_text: '12% descuento' },
    { slug: 'colecciones-ht-planner', title: 'HT Planner', subtitle: 'Wedding Coordination', hero_image: 'https://arrebolweddings.com/images/gallery/PyP-432.webp', landing_type: 'planner', adjustment_type: 'fixed', adjustment_value: -15000, show_badge: true, badge_text: '$15,000 de descuento' },
    
    // CLIENTS
    { slug: 'colecciones-paulina', title: 'Paulia R. Vasconcelos', subtitle: '14 de noviembre 2026, Mérida', hero_image: 'https://arrebolweddings.com/images/gallery/TOP-SyP-324-hero.webp', landing_type: 'client', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '' },
    { slug: 'colecciones-2026', title: 'Colecciones 2026', subtitle: 'Precios especiales', hero_image: 'https://arrebolweddings.com/images/gallery/SYO-832.webp', landing_type: 'client', adjustment_type: 'percentage', adjustment_value: -8, show_badge: true, badge_text: 'Promoción 2026' },
    { slug: 'colecciones-de-video-2026', title: 'Colecciones de Video 2026', subtitle: 'Paquetes de video', hero_image: 'https://arrebolweddings.com/images/gallery/AyJ-493.webp', landing_type: 'client', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '' },
    { slug: 'colecciones-de-foto-2026', title: 'Colecciones de Foto 2026', subtitle: 'Paquetes de fotografía', hero_image: 'https://arrebolweddings.com/images/gallery/CyD-80.webp', landing_type: 'client', adjustment_type: 'none', adjustment_value: 0, show_badge: false, badge_text: '' },
  ];

  if (useMemoryStorage) {
    memoryDB.landings = defaultLandings.map((landing, index) => ({
      id: index + 1,
      ...landing,
      created_at: new Date(),
      updated_at: new Date()
    }));
    res.json({ success: true, message: `Se importaron ${defaultLandings.length} landings correctamente`, count: defaultLandings.length });
  } else {
    try {
      // Clear existing landings
      await pool.query('DELETE FROM landings');
      
      // Insert new landings
      for (const landing of defaultLandings) {
        await pool.query(
          `INSERT INTO landings (slug, title, subtitle, hero_image, adjustment_type, adjustment_value, show_badge, badge_text, landing_type) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [landing.slug, landing.title, landing.subtitle, landing.hero_image, landing.adjustment_type, landing.adjustment_value, landing.show_badge, landing.badge_text, landing.landing_type]
        );
      }
      
      res.json({ success: true, message: `Se importaron ${defaultLandings.length} landings correctamente`, count: defaultLandings.length });
    } catch (error) {
      console.error('Error seeding landings:', error);
      res.status(500).json({ error: 'Error al importar landings' });
    }
  }
});

// Generate landing files (crear archivos físicos en Web-Arrebol)
app.post('/api/landings/:id/generate', async (req, res) => {
  const { id } = req.params;
  
  try {
    let landing;
    
    if (useMemoryStorage) {
      landing = memoryDB.landings?.find((l: any) => l.id === parseInt(id));
    } else {
      const result = await pool.query('SELECT * FROM landings WHERE id = $1', [id]);
      landing = result.rows[0];
    }
    
    if (!landing) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }
    
    // Ruta base del proyecto Web-Arrebol
    const webArrebolPath = path.join(process.cwd(), '..', 'Web-Arrebol', 'arrebol-weddings-site', 'app');
    const landingPath = path.join(webArrebolPath, landing.slug);
    
    // Crear directorio si no existe
    if (!fs.existsSync(landingPath)) {
      fs.mkdirSync(landingPath, { recursive: true });
    }
    
    // Generar contenido de page.tsx
    const pageContent = `import CollectionPageClient from '@/components/CollectionPageClient';

export const metadata = {
  title: '${landing.title} - Arrebol Weddings',
  description: '${landing.subtitle}',
};

export default function ${landing.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Page() {
  return (
    <CollectionPageClient
      title="${landing.title}"
      subtitle="${landing.subtitle}"
      heroImage="${landing.hero_image}"
      landingType="${landing.landing_type}"
      adjustmentType="${landing.adjustment_type}"
      adjustmentValue={${landing.adjustment_value}}
      showBadge={${landing.show_badge}}
      badgeText="${landing.badge_text}"
    />
  );
}
`;
    
    // Generar contenido de layout.tsx
    const layoutContent = `export default function ${landing.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
`;
    
    // Escribir archivos
    fs.writeFileSync(path.join(landingPath, 'page.tsx'), pageContent);
    fs.writeFileSync(path.join(landingPath, 'layout.tsx'), layoutContent);
    
    res.json({ 
      success: true, 
      message: `✅ Archivos generados exitosamente para "${landing.title}"\n\nArchivos creados:\n- app/${landing.slug}/page.tsx\n- app/${landing.slug}/layout.tsx\n\n¡Recuerda hacer commit de los cambios!`,
      files: [
        `app/${landing.slug}/page.tsx`,
        `app/${landing.slug}/layout.tsx`
      ]
    });
  } catch (error) {
    console.error('Error generating landing files:', error);
    res.status(500).json({ 
      error: 'Error al generar archivos de landing',
      details: (error as Error).message 
    });
  }
});

// Preview landing (simulación de preview)
app.post('/api/landings/preview', async (req, res) => {
  const landingData = req.body;
  
  try {
    // En una implementación completa, aquí se generaría un preview temporal
    // Por ahora solo retornamos la URL donde estaría el preview
    const previewUrl = `/preview/${landingData.slug || 'temp-preview'}`;
    
    res.json({ 
      success: true, 
      previewUrl,
      message: 'Preview generado (funcionalidad completa pendiente de implementar)'
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Error al generar preview' });
  }
});

// ============================================
// RECIBOS ENDPOINTS
// ============================================

// Get all recibos
app.get('/api/recibos', async (req, res) => {
  if (useMemoryStorage) {
    res.json(memoryDB.recibos || []);
  } else {
    try {
      const result = await pool.query(`
        SELECT r.*, c.client_name as contrato_client_name 
        FROM recibos r
        LEFT JOIN contratos c ON r.contrato_id = c.id
        ORDER BY r.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching recibos:', error);
      res.status(500).json({ error: 'Error al obtener recibos' });
    }
  }
});

// Get recibo by ID
app.get('/api/recibos/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMemoryStorage) {
    const recibo = memoryDB.recibos?.find((r: any) => r.id === parseInt(id));
    if (!recibo) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    res.json(recibo);
  } else {
    try {
      const result = await pool.query('SELECT * FROM recibos WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Recibo no encontrado' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching recibo:', error);
      res.status(500).json({ error: 'Error al obtener recibo' });
    }
  }
});

// Create new recibo
app.post('/api/recibos', async (req, res) => {
  const {
    contrato_id,
    client_name,
    client_email,
    receipt_number,
    amount,
    payment_method,
    payment_date,
    concept,
    notes
  } = req.body;

  if (useMemoryStorage) {
    if (!memoryDB.recibos) memoryDB.recibos = [];
    
    const newRecibo = {
      id: memoryDB.recibos.length + 1,
      contrato_id: contrato_id || null,
      client_name,
      client_email: client_email || '',
      receipt_number,
      amount: amount || 0,
      payment_method: payment_method || 'Transferencia',
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      concept: concept || 'Anticipo',
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    
    memoryDB.recibos.push(newRecibo);
    res.json(newRecibo);
  } else {
    try {
      const result = await pool.query(
        `INSERT INTO recibos (
          contrato_id, client_name, client_email, receipt_number, amount, 
          payment_method, payment_date, concept, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          contrato_id || null,
          client_name,
          client_email || '',
          receipt_number,
          amount || 0,
          payment_method || 'Transferencia',
          payment_date || new Date().toISOString().split('T')[0],
          concept || 'Anticipo',
          notes || ''
        ]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating recibo:', error);
      res.status(500).json({ error: 'Error al crear recibo' });
    }
  }
});

// Update recibo
app.put('/api/recibos/:id', async (req, res) => {
  const { id } = req.params;
  const {
    contrato_id,
    client_name,
    client_email,
    receipt_number,
    amount,
    payment_method,
    payment_date,
    concept,
    notes
  } = req.body;

  if (useMemoryStorage) {
    if (!memoryDB.recibos) memoryDB.recibos = [];
    
    const index = memoryDB.recibos.findIndex((r: any) => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    
    memoryDB.recibos[index] = {
      ...memoryDB.recibos[index],
      contrato_id: contrato_id || null,
      client_name,
      client_email: client_email || '',
      receipt_number,
      amount: amount || 0,
      payment_method: payment_method || 'Transferencia',
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      concept: concept || 'Anticipo',
      notes: notes || ''
    };
    
    res.json(memoryDB.recibos[index]);
  } else {
    try {
      const result = await pool.query(
        `UPDATE recibos SET 
          contrato_id = $1, client_name = $2, client_email = $3, receipt_number = $4,
          amount = $5, payment_method = $6, payment_date = $7, concept = $8, notes = $9
        WHERE id = $10
        RETURNING *`,
        [
          contrato_id || null,
          client_name,
          client_email || '',
          receipt_number,
          amount || 0,
          payment_method || 'Transferencia',
          payment_date || new Date().toISOString().split('T')[0],
          concept || 'Anticipo',
          notes || '',
          id
        ]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Recibo no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating recibo:', error);
      res.status(500).json({ error: 'Error al actualizar recibo' });
    }
  }
});

// Delete recibo
app.delete('/api/recibos/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMemoryStorage) {
    if (!memoryDB.recibos) memoryDB.recibos = [];
    
    const index = memoryDB.recibos.findIndex((r: any) => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    
    memoryDB.recibos.splice(index, 1);
    res.json({ success: true, message: 'Recibo eliminado' });
  } else {
    try {
      const result = await pool.query('DELETE FROM recibos WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Recibo no encontrado' });
      }
      
      res.json({ success: true, message: 'Recibo eliminado' });
    } catch (error) {
      console.error('Error deleting recibo:', error);
      res.status(500).json({ error: 'Error al eliminar recibo' });
    }
  }
});

// Generate PDF for recibo
app.get('/api/recibos/:id/pdf', async (req, res) => {
  const { id } = req.params;
  
  try {
    let recibo;
    
    if (useMemoryStorage) {
      recibo = memoryDB.recibos?.find((r: any) => r.id === parseInt(id));
    } else {
      const result = await pool.query('SELECT * FROM recibos WHERE id = $1', [id]);
      recibo = result.rows[0];
    }
    
    if (!recibo) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    
    // Nota: Implementación básica - se requeriría una librería como jsPDF o puppeteer
    res.json({ 
      success: true, 
      message: 'Funcionalidad de PDF pendiente de implementar con librería apropiada',
      recibo
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// ============================================
// CONTRATOS ENDPOINTS
// ============================================

// Get all contratos
app.get('/api/contratos', async (req, res) => {
  if (useMemoryStorage) {
    // Agregar campos por defecto a contratos existentes que no los tengan
    const contratos = (memoryDB.contratos || []).map((c: any) => ({
      ...c,
      client_address: c.client_address || '',
      venue_address: c.venue_address || '',
      coverage_hours: c.coverage_hours || 10,
      photographers_count: c.photographers_count || 1,
      videographers_count: c.videographers_count || 1,
      photos_quantity: c.photos_quantity || '600-700',
      deliverables: c.deliverables || [],
      second_payment_date: c.second_payment_date || null,
      travel_expenses: c.travel_expenses || false,
      meals_count: c.meals_count || 3,
      special_notes: c.special_notes || ''
    }));
    res.json(contratos);
  } else {
    try {
      const result = await pool.query(`
        SELECT c.*, p.name as project_name 
        FROM contratos c
        LEFT JOIN projects p ON c.project_id = p.id
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching contratos:', error);
      res.status(500).json({ error: 'Error al obtener contratos' });
    }
  }
});

// Get contrato by ID
app.get('/api/contratos/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMemoryStorage) {
    const contrato = memoryDB.contratos?.find((c: any) => c.id === parseInt(id));
    if (!contrato) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }
    // Agregar campos por defecto si no existen
    const contratoWithDefaults = {
      ...contrato,
      client_address: contrato.client_address || '',
      venue_address: contrato.venue_address || '',
      coverage_hours: contrato.coverage_hours || 10,
      photographers_count: contrato.photographers_count || 1,
      videographers_count: contrato.videographers_count || 1,
      photos_quantity: contrato.photos_quantity || '600-700',
      deliverables: contrato.deliverables || [],
      second_payment_date: contrato.second_payment_date || null,
      travel_expenses: contrato.travel_expenses || false,
      meals_count: contrato.meals_count || 3,
      special_notes: contrato.special_notes || ''
    };
    res.json(contratoWithDefaults);
  } else {
    try {
      const result = await pool.query(`
        SELECT c.*, p.name as project_name 
        FROM contratos c
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE c.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching contrato:', error);
      res.status(500).json({ error: 'Error al obtener contrato' });
    }
  }
});

// Create new contrato
app.post('/api/contratos', async (req, res) => {
  const {
    project_id,
    client_name,
    client_email,
    client_phone,
    client_address,
    wedding_date,
    venue,
    venue_address,
    package_type,
    coverage_hours,
    photographers_count,
    videographers_count,
    photos_quantity,
    deliverables,
    total_amount,
    deposit_amount,
    second_payment_date,
    travel_expenses,
    meals_count,
    deposit_paid,
    balance_paid,
    status,
    contract_date,
    notes,
    special_notes
  } = req.body;

  if (useMemoryStorage) {
    if (!memoryDB.contratos) memoryDB.contratos = [];
    
    const newContrato = {
      id: memoryDB.contratos.length + 1,
      project_id: project_id || null,
      client_name,
      client_email,
      client_phone: client_phone || '',
      client_address: client_address || '',
      wedding_date,
      venue: venue || '',
      venue_address: venue_address || '',
      package_type: package_type || 'Básico',
      coverage_hours: coverage_hours || 10,
      photographers_count: photographers_count || 1,
      videographers_count: videographers_count || 1,
      photos_quantity: photos_quantity || '600-700',
      deliverables: deliverables || [],
      total_amount: total_amount || 0,
      deposit_amount: deposit_amount || 0,
      second_payment_date: second_payment_date || null,
      travel_expenses: travel_expenses || false,
      meals_count: meals_count || 3,
      deposit_paid: deposit_paid || false,
      balance_paid: balance_paid || false,
      status: status || 'draft',
      contract_date: contract_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      special_notes: special_notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    memoryDB.contratos.push(newContrato);
    res.json(newContrato);
  } else {
    try {
      const result = await pool.query(
        `INSERT INTO contratos (
          project_id, client_name, client_email, client_phone, wedding_date, 
          venue, package_type, total_amount, deposit_amount, deposit_paid, 
          balance_paid, status, contract_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          project_id || null,
          client_name,
          client_email,
          client_phone || '',
          wedding_date,
          venue || '',
          package_type || 'Básico',
          total_amount || 0,
          deposit_amount || 0,
          deposit_paid || false,
          balance_paid || false,
          status || 'draft',
          contract_date || new Date().toISOString().split('T')[0],
          notes || ''
        ]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating contrato:', error);
      res.status(500).json({ error: 'Error al crear contrato' });
    }
  }
});

// Update contrato
app.put('/api/contratos/:id', async (req, res) => {
  const { id } = req.params;
  const {
    project_id,
    client_name,
    client_email,
    client_phone,
    client_address,
    wedding_date,
    venue,
    venue_address,
    package_type,
    coverage_hours,
    photographers_count,
    videographers_count,
    photos_quantity,
    deliverables,
    total_amount,
    deposit_amount,
    second_payment_date,
    travel_expenses,
    meals_count,
    deposit_paid,
    balance_paid,
    status,
    contract_date,
    notes,
    special_notes
  } = req.body;

  if (useMemoryStorage) {
    if (!memoryDB.contratos) memoryDB.contratos = [];
    
    const index = memoryDB.contratos.findIndex((c: any) => c.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }
    
    memoryDB.contratos[index] = {
      ...memoryDB.contratos[index],
      project_id: project_id || null,
      client_name,
      client_email,
      client_phone: client_phone || '',
      client_address: client_address || '',
      wedding_date,
      venue: venue || '',
      venue_address: venue_address || '',
      package_type: package_type || 'Básico',
      coverage_hours: coverage_hours || 10,
      photographers_count: photographers_count || 1,
      videographers_count: videographers_count || 1,
      photos_quantity: photos_quantity || '600-700',
      deliverables: deliverables || [],
      total_amount: total_amount || 0,
      deposit_amount: deposit_amount || 0,
      second_payment_date: second_payment_date || null,
      travel_expenses: travel_expenses || false,
      meals_count: meals_count || 3,
      deposit_paid: deposit_paid || false,
      balance_paid: balance_paid || false,
      status: status || 'draft',
      contract_date: contract_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      special_notes: special_notes || '',
      updated_at: new Date().toISOString()
    };
    
    res.json(memoryDB.contratos[index]);
  } else {
    try {
      const result = await pool.query(
        `UPDATE contratos SET 
          project_id = $1, client_name = $2, client_email = $3, client_phone = $4, 
          wedding_date = $5, venue = $6, package_type = $7, total_amount = $8, 
          deposit_amount = $9, deposit_paid = $10, balance_paid = $11, status = $12, 
          contract_date = $13, notes = $14, updated_at = NOW()
        WHERE id = $15
        RETURNING *`,
        [
          project_id || null,
          client_name,
          client_email,
          client_phone || '',
          wedding_date,
          venue || '',
          package_type || 'Básico',
          total_amount || 0,
          deposit_amount || 0,
          deposit_paid || false,
          balance_paid || false,
          status || 'draft',
          contract_date || new Date().toISOString().split('T')[0],
          notes || '',
          id
        ]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating contrato:', error);
      res.status(500).json({ error: 'Error al actualizar contrato' });
    }
  }
});

// Delete contrato
app.delete('/api/contratos/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMemoryStorage) {
    if (!memoryDB.contratos) memoryDB.contratos = [];
    
    const index = memoryDB.contratos.findIndex((c: any) => c.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }
    
    memoryDB.contratos.splice(index, 1);
    res.json({ success: true, message: 'Contrato eliminado' });
  } else {
    try {
      const result = await pool.query('DELETE FROM contratos WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json({ success: true, message: 'Contrato eliminado' });
    } catch (error) {
      console.error('Error deleting contrato:', error);
      res.status(500).json({ error: 'Error al eliminar contrato' });
    }
  }
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
