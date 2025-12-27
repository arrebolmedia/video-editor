import { useState, useEffect } from 'react';
import Login from './Login';

const API_BASE = import.meta.env.MODE === 'production' ? '/editor-api' : '/api';

interface Project {
  id: number;
  name: string;
  wedding_date?: string;
  created_at: string;
}

interface Scene {
  id: number;
  project_id: number;
  name: string;
  division: string;
  description: string;
  planned_duration: number;
  scene_order: number;
  is_anchor_moment: string;
  anchor_description: string;
  priority: string;
}

interface Version {
  id: number;
  project_id: number;
  name: string;
  type: string;
  target_duration_min: number;
  target_duration_max: number;
  actual_duration: number;
  status?: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const authValue = localStorage.getItem('auth');
    console.log('Initial auth check:', authValue);
    return authValue === 'true';
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState<number[]>([]);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [draggedScene, setDraggedScene] = useState<Scene | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [showOnlyAnchors, setShowOnlyAnchors] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [activeVersion, setActiveVersion] = useState<Version | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', wedding_date: '' });
  const [compactView, setCompactView] = useState(true);
  const [showScenesTable, setShowScenesTable] = useState(true);
  const [showSelectedTable, setShowSelectedTable] = useState(true);

  const handleLogin = (username: string, password: string) => {
    localStorage.setItem('auth', 'true');
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('Logout clicked!');
    localStorage.removeItem('auth');
    localStorage.removeItem('username');
    console.log('localStorage cleared, auth:', localStorage.getItem('auth'));
    setIsAuthenticated(false);
    console.log('isAuthenticated set to false');
    setSelectedProject(null);
    setProjects([]);
    // Forzar recarga de la página
    window.location.reload();
  };

  useEffect(() => {
    if (isAuthenticated) {
      syncWithBaserow();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedProject) {
      fetchScenes(selectedProject.id);
      fetchVersions(selectedProject.id);
      setProjectForm({
        name: selectedProject.name,
        wedding_date: selectedProject.wedding_date || ''
      });
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchScenes = async (projectId: number) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/scenes`);
      const data = await res.json();
      setScenes(data);
    } catch (error) {
      console.error('Error fetching scenes:', error);
    }
  };

  const fetchVersions = async (projectId: number) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/versions`);
      const data = await res.json();
      setVersions(data);
      
      // Auto-select Completo version
      const completoVersion = data.find((v: Version) => v.type === 'long');
      if (completoVersion) {
        setActiveVersion(completoVersion);
        loadVersionScenes(completoVersion.id);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const loadVersionScenes = async (versionId: number) => {
    try {
      const res = await fetch(`${API_BASE}/versions/${versionId}/scenes`);
      const sceneIds = await res.json();
      setSelectedScenes(sceneIds);
    } catch (error) {
      console.error('Error loading version scenes:', error);
    }
  };

  const saveVersionScenes = async (versionId: number, sceneIds: number[]) => {
    try {
      await fetch(`${API_BASE}/versions/${versionId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIds })
      });
    } catch (error) {
      console.error('Error saving version scenes:', error);
    }
  };

  const selectVersion = (version: Version) => {
    setActiveVersion(version);
    loadVersionScenes(version.id);
  };

  const updateVersionStatus = async (versionId: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/versions/${versionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        // Update local state
        setVersions(versions.map(v => 
          v.id === versionId ? { ...v, status } : v
        ));
        if (activeVersion?.id === versionId) {
          setActiveVersion({ ...activeVersion, status });
        }
      }
    } catch (error) {
      console.error('Error updating version status:', error);
    }
  };

  const syncWithBaserow = async () => {
    try {
      const res = await fetch(`${API_BASE}/sync/baserow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log(`Sincronización con Baserow: ${result.synced} proyectos nuevos de ${result.total} totales`);
      }
    } catch (error) {
      console.error('Error syncing with Baserow:', error);
    } finally {
      // Siempre cargar proyectos después de intentar sincronizar
      await fetchProjects();
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Create project clicked, name:', newProjectName);
    if (!newProjectName.trim()) {
      console.log('Empty project name, returning');
      return;
    }

    setLoading(true);
    console.log('Sending POST to:', `${API_BASE}/projects`);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, frame_rate: 24 })
      });
      
      console.log('Response status:', res.status);
      if (res.ok) {
        const project = await res.json();
        console.log('Project created:', project);

        setNewProjectName('');
        fetchProjects();
        setSelectedProject(project);
      } else {
        const errorText = await res.text();
        console.error('Error creating project:', res.status, errorText);
        alert('Error al crear proyecto: ' + errorText);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateScene = async (scene: Scene) => {
    try {
      const res = await fetch(`${API_BASE}/scenes/${scene.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scene)
      });
      
      if (res.ok && selectedProject) {
        fetchScenes(selectedProject.id);
        setEditingScene(null);
      }
    } catch (error) {
      console.error('Error updating scene:', error);
    }
  };

  const updateProject = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });
      
      if (res.ok) {
        const updated = await res.json();
        setSelectedProject(updated);
        setEditingProject(false);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDragStart = (scene: Scene) => {
    setDraggedScene(scene);
  };

  const handleDragOver = (e: React.DragEvent, targetScene: Scene) => {
    e.preventDefault();
    if (!draggedScene || draggedScene.id === targetScene.id) return;

    const newScenes = [...scenes];
    const draggedIdx = newScenes.findIndex(s => s.id === draggedScene.id);
    const targetIdx = newScenes.findIndex(s => s.id === targetScene.id);

    newScenes.splice(draggedIdx, 1);
    newScenes.splice(targetIdx, 0, draggedScene);

    newScenes.forEach((s, idx) => s.scene_order = idx);
    setScenes(newScenes);
  };

  const handleDragEnd = async () => {
    if (!draggedScene) return;

    try {
      await fetch('/api/scenes/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenes.map(s => ({ id: s.id, scene_order: s.scene_order }))
        })
      });
    } catch (error) {
      console.error('Error reordering scenes:', error);
    }

    setDraggedScene(null);
  };

  const toggleSceneSelection = (sceneId: number) => {
    if (!activeVersion) return;
    
    const newSelection = selectedScenes.includes(sceneId)
      ? selectedScenes.filter(id => id !== sceneId)
      : [...selectedScenes, sceneId];
    
    setSelectedScenes(newSelection);
    
    // Auto-save to active version
    saveVersionScenes(activeVersion.id, newSelection);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter scenes based on filters
  let filteredScenes = scenes;
  
  if (showOnlyAnchors) {
    filteredScenes = filteredScenes.filter(scene => scene.is_anchor_moment === 'SI');
  }
  
  if (showOnlySelected) {
    filteredScenes = filteredScenes.filter(scene => selectedScenes.includes(scene.id));
  }

  const groupedScenes = filteredScenes.reduce((acc, scene) => {
    if (!acc[scene.name]) {
      acc[scene.name] = [];
    }
    acc[scene.name].push(scene);
    return acc;
  }, {} as Record<string, Scene[]>);

  const toggleExpand = (sceneName: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneName)) {
      newExpanded.delete(sceneName);
    } else {
      newExpanded.add(sceneName);
    }
    setExpandedScenes(newExpanded);
  };

  const getTotalDuration = (sceneGroup: Scene[]) => {
    return sceneGroup.reduce((sum, s) => sum + s.planned_duration, 0);
  };

  // Check authentication FIRST
  if (!isAuthenticated) {
    console.log('Rendering Login component - isAuthenticated:', isAuthenticated);
    return <Login onLogin={handleLogin} />;
  }

  // Then check if project is selected
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-stone-50 text-gray-800">
        <header className="bg-white border-b border-stone-200 px-8 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Wedding Video Planner</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="container mx-auto px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Proyectos</h2>

            <form onSubmit={createProject} className="mb-12">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-gray-800"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
                >
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No hay proyectos aún. Crea uno para empezar.</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="w-full bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-400 hover:shadow-md transition text-left"
                  >
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{project.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {project.wedding_date && (
                        <span>
                          {new Date(project.wedding_date).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                      <span>
                        Creado: {new Date(project.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  console.log('Rendering main app - isAuthenticated:', isAuthenticated);
  return (
    <div className="min-h-screen bg-stone-50 text-gray-800">
      <header className="bg-white border-b border-stone-200 px-8 py-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-gray-800">Wedding Video Planner</h1>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Cerrar Sesión
              </button>
            </div>
            
            {editingProject ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Nombres de los novios"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
                <input
                  type="date"
                  value={projectForm.wedding_date}
                  onChange={(e) => setProjectForm({ ...projectForm, wedding_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
                <div className="flex gap-2">
                  <button
                    onClick={updateProject}
                    className="px-4 py-1 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingProject(false);
                      setProjectForm({
                        name: selectedProject.name,
                        wedding_date: selectedProject.wedding_date || ''
                      });
                    }}
                    className="px-4 py-1 bg-stone-100 hover:bg-stone-200 text-gray-700 text-sm rounded transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-800">{selectedProject.name}</p>
                  <button
                    onClick={() => setEditingProject(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition"
                  >
                    ✎ Editar
                  </button>
                </div>
                {selectedProject.wedding_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedProject.wedding_date).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSelectedProject(null)}
            className="text-sm text-gray-600 hover:text-gray-800 transition font-medium"
          >
            ← Volver a Proyectos
          </button>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Versions Panel - NOW FIRST */}
          <div className="w-full bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Versiones ({versions.length})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {versions.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">Creando versiones...</p>
              ) : (
                versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => selectVersion(version)}
                    className={`text-left bg-stone-50 border-2 rounded-lg p-4 hover:shadow-md transition ${
                      activeVersion?.id === version.id
                        ? 'border-gray-800 shadow-md'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 text-gray-800">{version.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Objetivo: {formatDuration(version.target_duration_min)} - {formatDuration(version.target_duration_max)}
                        </p>
                        <select
                          value={version.status || 'Pendiente'}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateVersionStatus(version.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-700"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Entregado">Entregado</option>
                        </select>
                      </div>
                      {activeVersion?.id === version.id && (
                        <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">Activa</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Scenes Table */}
          <div className="w-full bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScenesTable(!showScenesTable)}
                  className="text-gray-400 hover:text-gray-600 transition text-lg leading-none"
                >
                  {showScenesTable ? '−' : '+'}
                </button>
                <h2 className="text-xl font-bold text-gray-800">Escenas ({scenes.length})</h2>
              </div>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyAnchors}
                    onChange={(e) => setShowOnlyAnchors(e.target.checked)}
                    className="rounded accent-gray-700"
                  />
                  <span>Solo anclas</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlySelected}
                    onChange={(e) => setShowOnlySelected(e.target.checked)}
                    className="rounded accent-gray-700"
                    disabled={!activeVersion}
                  />
                  <span>Solo seleccionadas</span>
                </label>
              </div>
            </div>

            {!activeVersion ? (
              <p className="text-gray-400 text-center py-12">Selecciona una versión para empezar a planear.</p>
            ) : scenes.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No hay escenas. Importa el CSV con las 54 escenas de boda.</p>
            ) : !showScenesTable ? null : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-300 sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left w-12">#</th>
                      <th className="p-2 text-left min-w-[300px]">Escena</th>
                      <th className="p-2 text-left w-32">División</th>
                      <th className="p-2 text-left w-24">Ancla</th>
                      <th className="p-2 text-left min-w-[200px]">Momento Ancla</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedScenes).map(([sceneName, sceneGroup], groupIndex) => {
                      const isExpanded = expandedScenes.has(sceneName);
                      const hasAnchors = sceneGroup.some(s => s.is_anchor_moment === 'SI');
                      
                      // Generate custom description based on scene group content
                      const getGroupDescription = () => {
                        const descriptions = sceneGroup.map(s => s.description);
                        // Get unique keywords from descriptions
                        const allWords = descriptions.join(' ').toLowerCase().split(/\s+/);
                        const keywords = [...new Set(allWords)].filter(w => 
                          w.length > 4 && !['llegada', 'espera', 'acomodo', 'cierre', 'sesión'].includes(w)
                        );
                        return keywords.slice(0, 5).join(', ') || descriptions[0];
                      };
                      
                      const groupDescription = getGroupDescription();
                      
                      return (
                        <>
                          {/* Parent Row */}
                          <tr
                            key={`group-${sceneName}`}
                            className="bg-stone-50 border-b border-stone-200 hover:bg-stone-100 cursor-pointer transition"
                            onClick={() => toggleExpand(sceneName)}
                          >
                            <td className="p-2 text-center">
                              <span className="text-gray-500 text-sm font-light">{isExpanded ? '−' : '+'}</span>
                            </td>
                            <td className="p-2 font-mono text-gray-500 font-bold text-sm">{groupIndex + 1}</td>
                            <td className="p-2 font-semibold text-gray-800">{sceneName} <span className="text-gray-500 text-xs ml-2">({sceneGroup.length} partes)</span></td>
                            <td className="p-2 text-gray-500 text-xs">{groupDescription}</td>
                            <td className="p-2 text-center">
                              {hasAnchors && <span className="text-gray-700">●</span>}
                            </td>
                            <td className="p-2"></td>
                          </tr>
                          
                          {/* Child Rows */}
                          {isExpanded && sceneGroup.map((scene, subIndex) => (
                            <tr
                              key={scene.id}
                              className={`border-b border-stone-200 hover:bg-stone-50/50 bg-white transition ${
                                selectedScenes.includes(scene.id) ? 'bg-stone-100/50' : ''
                              }`}
                            >
                              <td className="p-2 pl-6">
                                <input
                                  type="checkbox"
                                  checked={selectedScenes.includes(scene.id)}
                                  onChange={() => toggleSceneSelection(scene.id)}
                                  disabled={!activeVersion}
                                  className="rounded accent-gray-700 disabled:opacity-30"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="p-2 font-mono text-gray-400 text-xs">{groupIndex + 1}.{subIndex + 1}</td>
                              <td className="p-2 text-gray-700 text-sm pl-6 font-medium">{scene.description}</td>
                              <td className="p-2">
                                {editingScene?.id === scene.id ? (
                                  <select
                                    value={editingScene.division}
                                    onChange={(e) => setEditingScene({ ...editingScene, division: e.target.value })}
                                    onBlur={() => updateScene(editingScene)}
                                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs text-gray-800 focus:ring-2 focus:ring-stone-400 focus:outline-none"
                                  >
                                    <option value="INTRODUCCION">INTRODUCCION</option>
                                    <option value="NUCLEO">NUCLEO</option>
                                    <option value="RESOLUCION">RESOLUCION</option>
                                  </select>
                                ) : (
                                  <span 
                                    className="text-xs px-2 py-1 bg-stone-100 text-gray-700 rounded cursor-pointer hover:bg-stone-200 transition"
                                    onClick={(e) => { e.stopPropagation(); setEditingScene(scene); }}
                                  >
                                    {scene.division}
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                {editingScene?.id === scene.id ? (
                                  <select
                                    value={editingScene.is_anchor_moment}
                                    onChange={(e) => setEditingScene({ ...editingScene, is_anchor_moment: e.target.value })}
                                    onBlur={() => updateScene(editingScene)}
                                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs text-gray-800 focus:ring-2 focus:ring-stone-400 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="NO">NO</option>
                                    <option value="SI">SI</option>
                                  </select>
                                ) : (
                                  <span 
                                    className={`text-xs px-2 py-1 rounded cursor-pointer transition ${
                                      scene.is_anchor_moment === 'SI' ? 'bg-gray-700 text-white' :
                                      'bg-stone-100 text-gray-600'
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); setEditingScene(scene); }}
                                  >
                                    {scene.is_anchor_moment}
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-xs text-gray-700">
                                {editingScene?.id === scene.id ? (
                                  <input
                                    type="text"
                                    value={editingScene.anchor_description}
                                    onChange={(e) => setEditingScene({ ...editingScene, anchor_description: e.target.value })}
                                    onBlur={() => updateScene(editingScene)}
                                    placeholder="Momento específico..."
                                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-gray-800 focus:ring-2 focus:ring-stone-400 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span 
                                    onClick={(e) => { e.stopPropagation(); setEditingScene(scene); }} 
                                    className="cursor-text hover:text-gray-900"
                                  >
                                    {scene.anchor_description || '-'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Preview Section */}
            {activeVersion && selectedScenes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setShowSelectedTable(!showSelectedTable)}
                    className="text-gray-400 hover:text-gray-600 transition text-lg leading-none"
                  >
                    {showSelectedTable ? '−' : '+'}
                  </button>
                  <h3 className="text-xl font-bold text-gray-800">
                    Seleccionadas: {activeVersion.name} ({selectedScenes.length} escenas)
                  </h3>
                </div>
                
                {showSelectedTable && (
                  <div className="bg-stone-50 rounded-lg p-4">
                  {compactView ? (
                    <div className="space-y-1">
                      {selectedScenes.map((sceneId, index) => {
                        const scene = scenes.find(s => s.id === sceneId);
                        if (!scene) return null;
                        return (
                          <div 
                            key={scene.id} 
                            draggable
                            onDragStart={() => setDraggedScene(scene)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (!draggedScene || draggedScene.id === scene.id) return;
                              const newOrder = [...selectedScenes];
                              const draggedIdx = newOrder.indexOf(draggedScene.id);
                              const targetIdx = newOrder.indexOf(scene.id);
                              newOrder.splice(draggedIdx, 1);
                              newOrder.splice(targetIdx, 0, draggedScene.id);
                              setSelectedScenes(newOrder);
                              if (activeVersion) saveVersionScenes(activeVersion.id, newOrder);
                            }}
                            onDragEnd={() => setDraggedScene(null)}
                            className={`px-3 py-2 bg-white rounded border border-stone-200 text-sm text-gray-700 cursor-move hover:border-gray-400 transition ${
                              draggedScene?.id === scene.id ? 'opacity-50' : ''
                            }`}
                          >
                            <span className="font-mono text-gray-400 text-xs mr-2">{index + 1}.</span>
                            {scene.description}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b border-stone-200">
                        <tr>
                          <th className="p-2 text-left w-12">#</th>
                          <th className="p-2 text-left">Escena</th>
                          <th className="p-2 text-left w-32">División</th>
                          <th className="p-2 text-left">Momento Ancla</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScenes.map((sceneId, index) => {
                          const scene = scenes.find(s => s.id === sceneId);
                          if (!scene) return null;
                          return (
                            <tr 
                              key={scene.id} 
                              draggable
                              onDragStart={() => setDraggedScene(scene)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (!draggedScene || draggedScene.id === scene.id) return;
                                const newOrder = [...selectedScenes];
                                const draggedIdx = newOrder.indexOf(draggedScene.id);
                                const targetIdx = newOrder.indexOf(scene.id);
                                newOrder.splice(draggedIdx, 1);
                                newOrder.splice(targetIdx, 0, draggedScene.id);
                                setSelectedScenes(newOrder);
                                if (activeVersion) saveVersionScenes(activeVersion.id, newOrder);
                              }}
                              onDragEnd={() => setDraggedScene(null)}
                              className={`border-b border-stone-200 hover:bg-white transition cursor-move ${
                                draggedScene?.id === scene.id ? 'opacity-50' : ''
                              }`}
                            >
                              <td className="p-2 font-mono text-gray-500 text-xs">{index + 1}</td>
                              <td className="p-2 text-gray-700 font-medium">{scene.description}</td>
                              <td className="p-2">
                                <span className="text-xs px-2 py-1 bg-white text-gray-700 rounded border border-stone-200">
                                  {scene.division}
                                </span>
                              </td>
                              <td className="p-2 text-xs text-gray-600">
                                {scene.is_anchor_moment === 'SI' ? scene.anchor_description || '●' : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
