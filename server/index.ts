import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, useMemoryStorage } from './db/connection.js';
import { defaultWeddingScenes } from './defaultScenes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage fallback
const memoryDB: any = {
  projects: [],
  scenes: [],
  versions: [],
  sceneRefs: []
};

let nextId = 1;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storage: useMemoryStorage ? 'memory' : 'postgresql' });
});

// Sync projects from Baserow
app.post('/api/sync/baserow', async (req, res) => {
  try {
    const baserowToken = process.env.BASEROW_TOKEN;
    const baserowUrl = process.env.BASEROW_URL || 'https://data.arrebolweddings.com';
    
    if (!baserowToken) {
      return res.status(500).json({ error: 'Baserow token not configured' });
    }

    // Fetch entregables from Baserow table 34
    const response = await fetch(`${baserowUrl}/api/database/rows/table/34/?user_field_names=true&size=200`, {
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
    const projects = data.results || [];
    
    let syncedCount = 0;
    let errors = [];

    if (useMemoryStorage) {
      // Memory storage
      for (const row of projects) {
        try {
          const existing = memoryDB.projects.find((p: any) => p.baserow_id === row.id);
          
          if (!existing) {
            const weddingDate = row['Fecha del Evento'] || null;
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

            await pool.query(
              'INSERT INTO projects (name, wedding_date, baserow_id, frame_rate) VALUES ($1, $2, $3, $4)',
              [projectName, weddingDate, row.id, 24]
            );
            syncedCount++;
          }
        } catch (err: any) {
          errors.push({ row_id: row.id, error: err.message });
        }
      }
    }

    console.log(`Baserow sync completed: ${syncedCount} new projects from ${projects.length} total`);
    res.json({ 
      success: true, 
      synced: syncedCount, 
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
    if (useMemoryStorage) {
      res.json(memoryDB.projects);
    } else {
      const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
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

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
