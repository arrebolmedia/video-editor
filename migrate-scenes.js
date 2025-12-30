import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5433,
  database: process.env.PGDATABASE || 'wedding_editor',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres123'
});

const newScenes = [
  // Ceremonia Civil - Palabras del juez (insertamos ANTES de "Entrada e inicio")
  { name: "Ceremonia Civil", division: "INTRODUCCION", description: "Palabras del juez", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "OPENING", priority: "nice-to-have", insertAfterDescription: null, insertBeforeDescription: "Entrada e inicio de ceremonia" },
  
  // Ceremonia Religiosa - Palabras del padre (insertamos ANTES de "Cortejo")
  { name: "Ceremonia Religiosa", division: "INTRODUCCION", description: "Palabras de bienvenida del padre", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "OPENING", priority: "nice-to-have", insertAfterDescription: null, insertBeforeDescription: "Cortejo" },
  
  // Sesión Novios - Beauty shot (insertamos al final)
  { name: "Sesión Novios", division: "RESOLUCION", description: "Beauty shot", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "CLOSING", priority: "nice-to-have", insertAfterDescription: "Interacción espontánea", insertBeforeDescription: null },
  
  // Brindis - Bienvenida (insertamos ANTES de "Discurso emocional")
  { name: "Brindis", division: "INTRODUCCION", description: "Bienvenida del anfitrión/MC", planned_duration: 30, is_anchor_moment: "NO", anchor_description: "OPENING", priority: "nice-to-have", insertAfterDescription: null, insertBeforeDescription: "Discurso emocional" },
  
  // Brindis - Palabras de novios (insertamos ANTES de "Discurso emocional")
  { name: "Brindis", division: "INTRODUCCION", description: "Palabras de apertura de los novios", planned_duration: 60, is_anchor_moment: "NO", anchor_description: "OPENING", priority: "nice-to-have", insertAfterDescription: "Bienvenida del anfitrión/MC", insertBeforeDescription: "Discurso emocional" },
  
  // Bailes - Chisperos (insertamos DESPUÉS de "Baile de esposos")
  { name: "Bailes", division: "RESOLUCION", description: "Chisperos durante primer baile", planned_duration: 45, is_anchor_moment: "NO", anchor_description: "CLOSING", priority: "nice-to-have", insertAfterDescription: "Baile de esposos", insertBeforeDescription: "Apertura de pista" },
  
  // Fiesta - Novios bailando (insertamos al final)
  { name: "Fiesta", division: "RESOLUCION", description: "Novios bailando juntos en la pista", planned_duration: 90, is_anchor_moment: "NO", anchor_description: "CLOSING", priority: "nice-to-have", insertAfterDescription: "Happenings", insertBeforeDescription: null }
];

async function migrateScenes() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await pool.query('SELECT 1');
    console.log('✅ Conectado exitosamente\n');

    // Obtener todos los proyectos
    const projectsResult = await pool.query('SELECT id, name FROM projects ORDER BY id');
    console.log(`📊 Total de proyectos: ${projectsResult.rows.length}\n`);

    let totalAdded = 0;

    for (const project of projectsResult.rows) {
      console.log(`\n🎬 Procesando proyecto: ${project.name} (ID: ${project.id})`);
      
      // Obtener escenas actuales
      const scenesResult = await pool.query(
        'SELECT id, name, description, scene_order FROM scenes WHERE project_id = $1 ORDER BY scene_order',
        [project.id]
      );
      
      console.log(`   Escenas actuales: ${scenesResult.rows.length}`);

      for (const newScene of newScenes) {
        // Verificar si ya existe
        const existingScene = scenesResult.rows.find(s => 
          s.name === newScene.name && s.description === newScene.description
        );

        if (existingScene) {
          console.log(`   ⏭️  Ya existe: ${newScene.name} - ${newScene.description}`);
          continue;
        }

        // Encontrar la posición correcta
        let targetOrder;
        
        if (newScene.insertBeforeDescription) {
          // Insertar ANTES de una escena específica
          const beforeScene = scenesResult.rows.find(s => 
            s.name === newScene.name && s.description === newScene.insertBeforeDescription
          );
          
          if (beforeScene) {
            targetOrder = beforeScene.scene_order;
            
            // Mover todas las escenas siguientes
            await pool.query(
              'UPDATE scenes SET scene_order = scene_order + 1 WHERE project_id = $1 AND scene_order >= $2',
              [project.id, targetOrder]
            );
          } else {
            console.log(`   ⚠️  No se encontró referencia: ${newScene.insertBeforeDescription}`);
            continue;
          }
        } else if (newScene.insertAfterDescription) {
          // Insertar DESPUÉS de una escena específica
          const afterScene = scenesResult.rows.find(s => 
            s.name === newScene.name && s.description === newScene.insertAfterDescription
          );
          
          if (afterScene) {
            targetOrder = afterScene.scene_order + 1;
            
            // Mover todas las escenas siguientes
            await pool.query(
              'UPDATE scenes SET scene_order = scene_order + 1 WHERE project_id = $1 AND scene_order >= $2',
              [project.id, targetOrder]
            );
          } else {
            console.log(`   ⚠️  No se encontró referencia: ${newScene.insertAfterDescription}`);
            continue;
          }
        }

        // Insertar la nueva escena
        await pool.query(
          `INSERT INTO scenes (project_id, name, division, description, planned_duration, scene_order, is_anchor_moment, anchor_description, priority)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            project.id,
            newScene.name,
            newScene.division,
            newScene.description,
            newScene.planned_duration,
            targetOrder,
            newScene.is_anchor_moment,
            newScene.anchor_description,
            newScene.priority
          ]
        );

        console.log(`   ✅ Agregada: ${newScene.name} - ${newScene.description} (orden: ${targetOrder})`);
        totalAdded++;
      }
    }

    console.log(`\n🎉 Migración completada: ${totalAdded} escenas agregadas en total`);
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

migrateScenes();
