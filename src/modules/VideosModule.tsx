import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface Project {
  id: number;
  name: string;
  wedding_date?: string;
  assigned_to?: string | null;
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
  suggested_songs?: Array<{title: string, artist: string, mood: string, tempo: string}>;
  suggested_opening_scenes?: Scene[];
  suggested_closing_scenes?: Scene[];
}

interface User {
  email: string;
  name: string;
}

interface VideosModuleProps {
  userEmail: string;
  userName: string;
  userRole: string;
}

/**
 * VideosModule - Editor de videos de bodas
 * Extraído del App.tsx original, mantiene toda la funcionalidad:
 * - Gestión de proyectos (crear, editar, asignar editores)
 * - Escenas por proyecto (drag & drop, edición inline)
 * - Versiones (Teaser, Highlights, Completo)
 * - Sugerencias de escenas y canciones
 * - Sincronización con Baserow
 */
function VideosModule({ userEmail, userName, userRole }: VideosModuleProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    const saved = localStorage.getItem('selectedProjectId');
    return saved ? null : null; // Will be loaded after projects fetch
  });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
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
  const [showScenesTable, setShowScenesTable] = useState(false);
  const [showSelectedTable, setShowSelectedTable] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionKey, setSuggestionKey] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedSuggestion, setDraggedSuggestion] = useState<Scene | null>(null);
  const [openingSuggestions, setOpeningSuggestions] = useState<Scene[]>([]);
  const [anchorOrder, setAnchorOrder] = useState<Scene[]>([]);
  const [closingSuggestions, setClosingSuggestions] = useState<Scene[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [suggestedSongs, setSuggestedSongs] = useState<Array<{title: string, artist: string, mood: string, tempo: string}>>([]);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  
  // Categoría 1: Canciones clásicas - 31 canciones (Teaser + Highlights canción 1)
  const classicSongs = [
    { title: 'At Last', artist: 'Etta James', mood: 'classic', tempo: 'slow' },
    { title: 'L-O-V-E', artist: 'Nat King Cole', mood: 'classic', tempo: 'medium' },
    { title: 'My Girl', artist: 'The Temptations', mood: 'classic', tempo: 'medium' },
    { title: 'My Way', artist: 'Frank Sinatra', mood: 'classic', tempo: 'medium' },
    { title: "That's Life", artist: 'Frank Sinatra', mood: 'classic', tempo: 'medium' },
    { title: 'I Say a Little Prayer', artist: 'Aretha Franklin', mood: 'classic', tempo: 'medium' },
    { title: "Can't Take My Eyes off You", artist: 'Frankie Valli', mood: 'romantic', tempo: 'medium' },
    { title: 'Stand By Me', artist: 'Ben E. King', mood: 'classic', tempo: 'slow' },
    { title: 'Fly Me To The Moon', artist: 'Frank Sinatra, Count Basie', mood: 'classic', tempo: 'medium' },
    { title: 'What A Wonderful World', artist: 'Louis Armstrong', mood: 'classic', tempo: 'slow' },
    { title: "Ain't No Mountain High Enough", artist: 'Marvin Gaye, Tammi Terrell', mood: 'classic', tempo: 'fast' },
    { title: 'I Just Called To Say I Love You', artist: 'Stevie Wonder', mood: 'romantic', tempo: 'medium' },
    { title: 'Strangers In The Night', artist: 'Frank Sinatra', mood: 'classic', tempo: 'medium' },
    { title: 'La Vie En Rose', artist: 'Louis Armstrong And His Orchestra', mood: 'classic', tempo: 'slow' },
    { title: 'Put Your Head on My Shoulder', artist: 'Paul Anka', mood: 'romantic', tempo: 'slow' },
    { title: 'In the Mood', artist: 'Glenn Miller', mood: 'classic', tempo: 'fast' },
    { title: "It's Been A Long, Long Time", artist: 'Harry James', mood: 'classic', tempo: 'medium' },
    { title: "I Don't Want To Set The World On Fire", artist: 'The Ink Spots', mood: 'classic', tempo: 'slow' },
    { title: 'Dream A Little Dream Of Me', artist: 'Ella Fitzgerald, Louis Armstrong', mood: 'classic', tempo: 'slow' },
    { title: "It's A Rather Long Time", artist: 'Kitty Kallen, The Harry James Orchestra', mood: 'classic', tempo: 'medium' },
    { title: "We'll Meet Again", artist: 'Vera Lynn', mood: 'classic', tempo: 'medium' },
    { title: 'Unchained Melody', artist: 'The Righteous Brothers', mood: 'romantic', tempo: 'slow' },
    { title: "That's Amore", artist: 'Dean Martin', mood: 'classic', tempo: 'medium' },
    { title: 'Orange Colored Sky', artist: 'Nat King Cole', mood: 'classic', tempo: 'fast' },
    { title: 'Cheek To Cheek', artist: 'Fred Astaire', mood: 'classic', tempo: 'medium' },
    { title: 'The Way You Look Tonight', artist: 'Tony Bennett', mood: 'romantic', tempo: 'slow' },
    { title: 'Unforgettable', artist: 'Nat King Cole', mood: 'romantic', tempo: 'slow' },
    { title: 'Dream A Little Dream Of Me', artist: 'Doris Day', mood: 'classic', tempo: 'slow' },
    { title: "Can't Help Falling In Love", artist: 'Elvis Presley', mood: 'romantic', tempo: 'slow' },
    { title: 'A Summer Place', artist: 'Andy Williams', mood: 'romantic', tempo: 'slow' },
    { title: 'More (Theme From Mondo Cane)', artist: 'Frank Sinatra, Count Basie', mood: 'classic', tempo: 'medium' }
  ];

  // Categoría 2: Música clásica instrumental - 13 canciones (Highlights canción 2)
  const instrumentalSongs = [
    { title: 'II Allemande', artist: 'Brooklyn Classical', mood: 'classical', tempo: 'medium' },
    { title: 'Scorched Earth', artist: 'Maya Beisitzman', mood: 'classical', tempo: 'medium' },
    { title: 'Sojourner', artist: 'Ardie Son', mood: 'classical', tempo: 'medium' },
    { title: 'Winterlight', artist: 'Brianna Tam', mood: 'classical', tempo: 'slow' },
    { title: 'Arvo Pärt Spiegel im Spiegel for Cello and Piano', artist: 'Edward Arron & Jeewon Park at the Clark', mood: 'classical', tempo: 'slow' },
    { title: 'Come Back Home', artist: 'Ardie Son', mood: 'classical', tempo: 'medium' },
    { title: 'IV Sarabande', artist: 'Brooklyn Classical', mood: 'classical', tempo: 'slow' },
    { title: 'Gymnopédie no 1', artist: 'Romi Kopelman', mood: 'classical', tempo: 'slow' },
    { title: 'Hallelujah', artist: 'Unknown', mood: 'classical', tempo: 'slow' },
    { title: 'Bésame Mucho on Harp & Cello', artist: 'Unknown', mood: 'classical', tempo: 'medium' },
    { title: 'Enter Reworked', artist: 'Christopher Galovan', mood: 'classical', tempo: 'medium' },
    { title: 'Reminiscence', artist: 'Ben Winwood', mood: 'classical', tempo: 'slow' },
    { title: 'Flower Duet Lakmé', artist: 'Hawkins', mood: 'classical', tempo: 'medium' }
  ];

  // Categoría 3: Canciones modernas (Highlights canción 3)
  const modernSongs = [
    { title: 'Innerbloom', artist: 'RÜFÜS DU SOL', mood: 'modern', tempo: 'medium' },
    { title: 'Freeze', artist: 'Kygo', mood: 'modern', tempo: 'medium' },
    { title: 'Feel So Close (Radio Edit)', artist: 'Calvin Harris', mood: 'modern', tempo: 'fast' },
    { title: 'Saturday Night', artist: 'The Underdog Project', mood: 'modern', tempo: 'fast' },
    { title: "Can't Hold Us (feat. Ray Dalton)", artist: 'Macklemore & Ryan Lewis', mood: 'modern', tempo: 'fast' },
    { title: 'Hold My Hand', artist: 'Jess Glynne', mood: 'modern', tempo: 'fast' },
    { title: 'Heaven Is A Place On Earth (Official Music Video)', artist: 'W&W x AXMO', mood: 'modern', tempo: 'fast' },
    { title: 'Nalu', artist: 'Deep Chills, Brendan Mills', mood: 'modern', tempo: 'medium' }
  ];

  // Inicializar datos al montar el componente
  useEffect(() => {
    syncWithBaserow();
    fetchUsers();
  }, []);

  // Restaurar proyecto seleccionado desde URL o localStorage al cargar
  useEffect(() => {
    if (projects.length > 0 && !selectedProject && !loadingProjects) {
      // Primero intentar desde URL hash
      const hash = window.location.hash;
      const match = hash.match(/^#\/project\/(\d+)$/);
      
      let projectId: string | null = null;
      if (match) {
        projectId = match[1];
      } else {
        // Si no hay hash, intentar desde localStorage
        projectId = localStorage.getItem('selectedProjectId');
      }
      
      if (projectId) {
        const project = projects.find(p => p.id === parseInt(projectId));
        if (project) {
          setSelectedProject(project);
        }
      }
    }
  }, [projects, loadingProjects]);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id.toString());
      // Actualizar URL con el ID del proyecto
      window.history.replaceState(null, '', `#/project/${selectedProject.id}`);
      fetchScenes(selectedProject.id);
      fetchVersions(selectedProject.id);
      setProjectForm({
        name: selectedProject.name,
        wedding_date: selectedProject.wedding_date || ''
      });
    } else if (!loadingProjects) {
      // Solo limpiar la URL si no estamos cargando proyectos
      // (para evitar resetear la URL durante el refresh inicial)
      const hash = window.location.hash;
      const hasProjectInUrl = hash.match(/^#\/project\/(\d+)$/);
      
      if (!hasProjectInUrl) {
        localStorage.removeItem('selectedProjectId');
        // Volver a la vista principal
        window.history.replaceState(null, '', '#/');
      }
    }
  }, [selectedProject, loadingProjects]);

  // Cargar sugerencias guardadas cuando se selecciona una versión
  useEffect(() => {
    if (activeVersion && scenes.length > 0 && !suggestionsLoaded) {
      // Si tiene sugerencias guardadas, usarlas (verificar que no sean null y tengan elementos)
      const hasSavedSongs = activeVersion.suggested_songs && Array.isArray(activeVersion.suggested_songs) && activeVersion.suggested_songs.length > 0;
      const hasSavedOpening = activeVersion.suggested_opening_scenes && Array.isArray(activeVersion.suggested_opening_scenes) && activeVersion.suggested_opening_scenes.length > 0;
      const hasSavedClosing = activeVersion.suggested_closing_scenes && Array.isArray(activeVersion.suggested_closing_scenes) && activeVersion.suggested_closing_scenes.length > 0;
      
      console.log('Verificando sugerencias guardadas:', {
        version: activeVersion.name,
        hasSavedSongs,
        hasSavedOpening,
        hasSavedClosing,
        songsData: activeVersion.suggested_songs,
        openingData: activeVersion.suggested_opening_scenes,
        closingData: activeVersion.suggested_closing_scenes
      });
      
      if (hasSavedSongs || hasSavedOpening || hasSavedClosing) {
        // Usar sugerencias guardadas
        console.log('✅ Cargando sugerencias guardadas');
        if (hasSavedSongs) setSuggestedSongs(activeVersion.suggested_songs!);
        if (hasSavedOpening) setOpeningSuggestions(activeVersion.suggested_opening_scenes!);
        if (hasSavedClosing) setClosingSuggestions(activeVersion.suggested_closing_scenes!);
        
        // Generar solo las que faltan
        if (!hasSavedSongs || !hasSavedOpening || !hasSavedClosing) {
          console.log('⚠️ Generando sugerencias faltantes');
          const suggestions = !hasSavedOpening || !hasSavedClosing ? getSuggestedScenes() : { opening: [], closing: [], anchor: [] };
          const songs = !hasSavedSongs ? getSuggestedSongs() : [];
          
          if (!hasSavedOpening) setOpeningSuggestions(suggestions.opening);
          if (!hasSavedClosing) setClosingSuggestions(suggestions.closing);
          if (!hasSavedSongs) setSuggestedSongs(songs);
          if (suggestions.anchor) setAnchorOrder(suggestions.anchor);
          
          // Guardar las nuevas sugerencias
          saveSuggestions(
            hasSavedOpening ? activeVersion.suggested_opening_scenes! : suggestions.opening,
            hasSavedClosing ? activeVersion.suggested_closing_scenes! : suggestions.closing,
            hasSavedSongs ? activeVersion.suggested_songs! : songs
          );
        }
      } else {
        // No hay sugerencias guardadas, generar nuevas
        console.log('🔄 No hay sugerencias guardadas, generando nuevas...');
        const shouldShowSuggestions = !activeVersion.name.toLowerCase().includes('full');
        if (shouldShowSuggestions) {
          const suggestions = getSuggestedScenes();
          setOpeningSuggestions(suggestions.opening);
          setAnchorOrder(suggestions.anchor);
          setClosingSuggestions(suggestions.closing);
          const songs = getSuggestedSongs();
          setSuggestedSongs(songs);
          
          // Guardar las sugerencias en la base de datos
          console.log('💾 Guardando nuevas sugerencias');
          saveSuggestions(suggestions.opening, suggestions.closing, songs);
        }
      }
      
      setSuggestionsLoaded(true); // Marcar como cargadas para evitar regeneraciones
    }
  }, [activeVersion, scenes, suggestionsLoaded]);

  // Actualizar todas las sugerencias solo cuando se regeneran manualmente
  useEffect(() => {
    // No mostrar sugerencias en versión full (se usa todo el material en orden cronológico)
    const shouldShowSuggestions = activeVersion && !activeVersion.name.toLowerCase().includes('full');
    
    if (showSuggestions && shouldShowSuggestions && scenes.length > 0 && suggestionKey > 0) {
      const suggestions = getSuggestedScenes();
      setOpeningSuggestions(suggestions.opening);
      setAnchorOrder(suggestions.anchor);
      setClosingSuggestions(suggestions.closing);
      const songs = getSuggestedSongs();
      setSuggestedSongs(songs);
      
      // Guardar las sugerencias en la base de datos
      saveSuggestions(suggestions.opening, suggestions.closing, songs);
      setSuggestionsLoaded(true); // Marcar como cargadas después de regenerar
    }
  }, [suggestionKey]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams({
        user: userEmail,
        role: userRole
      });
      const res = await fetch(`${API_BASE}/projects?${params}`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const assignEditor = async (projectId: number, editorEmail: string | null) => {
    try {
      await fetch(`${API_BASE}/projects/${projectId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: editorEmail })
      });
      
      // Actualizar proyecto en el estado local
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, assigned_to: editorEmail } : p
      ));
      
      // Si es el proyecto seleccionado, actualizarlo también
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, assigned_to: editorEmail });
      }
    } catch (error) {
      console.error('Error assigning editor:', error);
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
      
      // Parsear campos JSONB si vienen como strings
      const parsedData = data.map((v: any) => {
        const parseSuggestion = (field: any) => {
          if (!field) return null;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
            } catch {
              return null;
            }
          }
          return Array.isArray(field) && field.length > 0 ? field : null;
        };
        
        return {
          ...v,
          suggested_songs: parseSuggestion(v.suggested_songs),
          suggested_opening_scenes: parseSuggestion(v.suggested_opening_scenes),
          suggested_closing_scenes: parseSuggestion(v.suggested_closing_scenes)
        };
      });
      
      console.log('Versions loaded:', parsedData.map((v: any) => ({
        name: v.name,
        hasSongs: !!v.suggested_songs,
        hasOpening: !!v.suggested_opening_scenes,
        hasClosing: !!v.suggested_closing_scenes
      })));
      
      setVersions(parsedData);
      
      // Auto-select Completo version
      const completoVersion = parsedData.find((v: Version) => v.type === 'long');
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
    setSuggestionsLoaded(false); // Reset flag cuando se cambia de versión
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
        body: JSON.stringify({ 
          name: newProjectName, 
          frame_rate: 24,
          wedding_date: newProjectDate || null
        })
      });
      
      console.log('Response status:', res.status);
      if (res.ok) {
        const project = await res.json();
        console.log('Project created:', project);

        setNewProjectName('');
        setNewProjectDate('');
        setShowCreateModal(false);
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
      await fetch(`${API_BASE}/scenes/reorder`, {
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

  const getSuggestedScenes = () => {
    if (!activeVersion) return { opening: [], anchor: [], closing: [] };

    // Función para shuffle aleatorio
    const shuffle = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Openings: escenas con OPENING explícito O First Look novio
    const openingScenes = shuffle(scenes.filter(s => 
      s.anchor_description === 'OPENING' ||
      (s.name === 'First Look' && s.description === 'First look novio')
    ));
    const anchorScenes = shuffle(scenes.filter(s => s.is_anchor_moment === 'SI'));
    // Closings: escenas con CLOSING explícito O anchors en RESOLUCION
    const closingScenes = shuffle(scenes.filter(s => 
      s.anchor_description === 'CLOSING' || 
      (s.is_anchor_moment === 'SI' && s.division === 'RESOLUCION')
    ));

    // Determinar cantidad según el nombre de la versión
    const versionName = activeVersion.name.toLowerCase();
    let openingCount = 1;
    let anchorCount = 5;
    let closingCount = 1;

    if (versionName.includes('highlights')) {
      anchorCount = 10;
    } else if (versionName.includes('full')) {
      anchorCount = 15;
    }

    return {
      opening: openingScenes.slice(0, openingCount),
      anchor: anchorScenes.slice(0, anchorCount),
      closing: closingScenes.slice(0, closingCount)
    };
  };

  const getTotalDuration = (sceneGroup: Scene[]) => {
    return sceneGroup.reduce((sum, s) => sum + s.planned_duration, 0);
  };

  const saveSuggestions = async (openingScenes: Scene[], closingScenes: Scene[], songs: any[]) => {
    if (!activeVersion) return;
    
    try {
      await fetch(`${API_BASE}/versions/${activeVersion.id}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songs,
          openingScenes,
          closingScenes
        })
      });
    } catch (error) {
      console.error('Error saving suggestions:', error);
    }
  };

  const getSuggestedSongs = () => {
    if (!activeVersion) return [];

    const shuffle = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const versionName = activeVersion.name.toLowerCase();
    
    if (versionName.includes('teaser')) {
      // Teaser: 1 canción de Categoría 1
      return shuffle(classicSongs).slice(0, 1);
    } else if (versionName.includes('highlights')) {
      // Highlights: 1 de cada categoría (3 canciones total)
      const song1 = shuffle(classicSongs)[0];
      const song2 = shuffle(instrumentalSongs)[0];
      const song3 = shuffle(modernSongs)[0];
      return [song1, song2, song3];
    }

    return [];
  };

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.wedding_date && project.wedding_date.includes(searchTerm))
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          if (!a.wedding_date && !b.wedding_date) comparison = 0;
          else if (!a.wedding_date) comparison = 1;
          else if (!b.wedding_date) comparison = -1;
          else comparison = new Date(a.wedding_date).getTime() - new Date(b.wedding_date).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Si estamos cargando proyectos y hay un proyecto en la URL, mostrar loading
  const hash = window.location.hash;
  const hasProjectInUrl = hash.match(/^#\/project\/(\d+)$/);
  
  if (loadingProjects && hasProjectInUrl) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  // Then check if project is selected
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-stone-50 text-gray-800">
        <main className="main-container py-12">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-3xl font-bold">Proyectos</h2>
              {/* Solo admin puede crear proyectos */}
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span>+</span> Nuevo Proyecto
                </button>
              )}
            </div>

            {/* Search and Sort Controls */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre o fecha..."
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-gray-800"
                  />
                </div>
                <div className="flex border border-stone-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-4 py-3 transition ${sortBy === 'date' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-stone-50'}`}
                  >
                    Fecha
                  </button>
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-4 py-3 transition ${sortBy === 'name' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-stone-50'}`}
                  >
                    Nombre
                  </button>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-3 bg-white text-gray-600 hover:bg-stone-50 transition border-l border-stone-300"
                    title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                  >
                    <span className={sortOrder === 'asc' ? 'text-gray-800' : 'text-gray-300'}>↑</span>
                    <span className={sortOrder === 'desc' ? 'text-gray-800' : 'text-gray-300'}>↓</span>
                  </button>
                </div>
                <div className="flex border border-stone-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-3 transition ${viewMode === 'cards' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-stone-50'}`}
                  >
                    ▦ Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-3 transition ${viewMode === 'table' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-stone-50'}`}
                  >
                    ☰ Tabla
                  </button>
                </div>
              </div>
              {!loadingProjects && filteredAndSortedProjects.length > 0 && (
                <p className="text-sm text-gray-600">
                  {filteredAndSortedProjects.length} proyecto{filteredAndSortedProjects.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProjects.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {viewMode === 'cards' ? (
              <div className="space-y-4">
                {loadingProjects ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                </div>
              ) : filteredAndSortedProjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">No hay proyectos aún. Crea uno para empezar.</p>
                ) : (
                  filteredAndSortedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="w-full bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-400 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-left flex-1"
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
                      
                      {/* Selector de editor solo visible para admin */}
                      {userRole === 'admin' && (
                        <div className="ml-4 flex items-center gap-2">
                          <label className="text-sm text-gray-600">Editor:</label>
                          <select
                            value={project.assigned_to || ''}
                            onChange={(e) => assignEditor(project.id, e.target.value || null)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm border border-stone-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800"
                          >
                            <option value="">Sin asignar</option>
                            {users.map(user => (
                              <option key={user.email} value={user.email}>{user.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {/* Mostrar editor asignado para todos los usuarios */}
                    {project.assigned_to && (
                      <div className="text-xs text-gray-500">
                        Asignado a: {users.find(u => u.email === project.assigned_to)?.name || project.assigned_to}
                      </div>
                    )}
                  </div>
                ))
              )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="text-left p-4">Proyecto</th>
                      <th className="text-left p-4">Fecha del Evento</th>
                      <th className="text-left p-4">Creado</th>
                      {userRole === 'admin' && <th className="text-left p-4">Editor</th>}
                      <th className="text-left p-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProjects ? (
                      <tr>
                        <td colSpan={4} className="py-12">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAndSortedProjects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-gray-500 text-center py-12">No hay proyectos aún. Crea uno para empezar.</td>
                      </tr>
                    ) : (
                      filteredAndSortedProjects.map((project) => (
                        <tr key={project.id} className="border-b border-stone-200 hover:bg-stone-50 transition">
                          <td className="p-4">
                            <span className="font-semibold text-gray-800">{project.name}</span>
                            {project.assigned_to && userRole !== 'admin' && (
                              <div className="text-xs text-gray-500 mt-1">
                                Asignado a: {users.find(u => u.email === project.assigned_to)?.name || project.assigned_to}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-gray-600">
                            {project.wedding_date ? (
                              new Date(project.wedding_date).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            ) : '-'}
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {new Date(project.created_at).toLocaleDateString('es-ES')}
                          </td>
                          {userRole === 'admin' && (
                            <td className="p-4">
                              <select
                                value={project.assigned_to || ''}
                                onChange={(e) => assignEditor(project.id, e.target.value || null)}
                                className="text-sm border border-stone-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800"
                              >
                                <option value="">Sin asignar</option>
                                {users.map(user => (
                                  <option key={user.email} value={user.email}>{user.name}</option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition"
                            >
                              Abrir
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Modal de Crear Proyecto */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Nuevo Proyecto</h3>
              <form onSubmit={createProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ej: María & Juan - Boda"
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-gray-800"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    value={newProjectDate}
                    onChange={(e) => setNewProjectDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-gray-800"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setNewProjectDate('');
                    }}
                    className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-gray-700 rounded-lg font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
                  >
                    {loading ? 'Creando...' : 'Crear Proyecto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-gray-800">
      <main className="main-container py-8">
        <div className="space-y-8">
          {/* Back button */}
          <div className="flex justify-start">
            <button
              onClick={() => setSelectedProject(null)}
              className="text-sm text-gray-600 hover:text-gray-800 transition font-medium"
            >
              ← Volver a Proyectos
            </button>
          </div>
          
          {/* Project Info */}
          <div className="text-center">
            {editingProject ? (
              <div className="space-y-3 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Nombres de los novios"
                  className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-center"
                />
                <input
                  type="date"
                  value={projectForm.wedding_date}
                  onChange={(e) => setProjectForm({ ...projectForm, wedding_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-center"
                />
                {/* Selector de editor solo visible para admin */}
                {userRole === 'admin' && (
                  <div className="flex items-center justify-center gap-3">
                    <label className="text-gray-700 font-medium">Editor asignado:</label>
                    <select
                      value={selectedProject.assigned_to || ''}
                      onChange={(e) => assignEditor(selectedProject.id, e.target.value || null)}
                      className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gray-700"
                    >
                      <option value="">Sin asignar</option>
                      {users.map(user => (
                        <option key={user.email} value={user.email}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={updateProject}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
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
                    className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-gray-700 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-heading text-3xl font-bold text-gray-800 mb-2">{selectedProject.name}</h2>
                {selectedProject.wedding_date && (
                  <p className="text-lg text-gray-600 mb-3">
                    {new Date(selectedProject.wedding_date).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
                {/* Mostrar editor asignado */}
                {selectedProject.assigned_to && (
                  <p className="text-sm text-gray-500 mb-2">
                    Editor: {users.find(u => u.email === selectedProject.assigned_to)?.name || selectedProject.assigned_to}
                  </p>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={() => setEditingProject(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition"
                  >
                    ✎ Editar
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Versions Panel */}
          <div className="w-full bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Versiones ({versions.length})</h2>
              {scenes.length === 0 && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/projects/${selectedProject.id}/initialize-scenes`, {
                        method: 'POST',
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(`✅ ${data.message}\nEscenas agregadas: ${data.scenes}`);
                        fetchScenes(selectedProject.id);
                        fetchVersions(selectedProject.id);
                      }
                    } catch (error) {
                      alert('Error al inicializar escenas');
                      console.error(error);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                >
                  + Agregar Escenas
                </button>
              )}
            </div>
            
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
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Suggestions Modal */}
          {showSuggestions && activeVersion && !activeVersion.name.toLowerCase().includes('full') && (() => {
            const totalSuggested = openingSuggestions.length + anchorOrder.length + closingSuggestions.length;
            
            return (
              <div className="w-full bg-white border border-stone-200 rounded-lg p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                      className="text-gray-400 hover:text-gray-600 transition text-lg leading-none"
                    >
                      {suggestionsExpanded ? '−' : '+'}
                    </button>
                    <h2 className="font-heading text-2xl font-bold text-gray-800">
                      Sugerencias para {activeVersion.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSuggestionKey(prev => prev + 1)}
                    className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                  >
                    Regenerar Sugerencias
                  </button>
                </div>
                
                {suggestionsExpanded && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Introducción */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-800">Introducción</h3>
                      <span className="text-xs bg-stone-100 px-2 py-1 rounded">{openingSuggestions.length} escenas</span>
                    </div>
                    <div className="space-y-2">
                      {openingSuggestions.map((scene) => (
                        <div
                          key={scene.id}
                          className="p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition"
                        >
                          <div className="text-sm font-medium text-gray-800 mb-1">{scene.name}</div>
                          <div className="text-xs text-gray-600">{scene.description}</div>
                          {scene.anchor_description && (
                            <div className="text-xs text-gray-500 mt-1 italic">● {scene.anchor_description}</div>
                          )}
                        </div>
                      ))}
                      {openingSuggestions.length === 0 && (
                        <div className="text-sm text-gray-400 italic">No hay escenas de apertura marcadas como ancla</div>
                      )}
                    </div>
                  </div>

                  {/* Desarrollo */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-800">Desarrollo</h3>
                      <span className="text-xs bg-stone-100 px-2 py-1 rounded">{anchorOrder.length} escenas</span>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {anchorOrder.map((scene, index) => (
                        <div
                          key={scene.id}
                          draggable="true"
                          onDragStart={(e) => {
                            setDraggedSuggestion(scene);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', scene.id.toString());
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!draggedSuggestion || draggedSuggestion.id === scene.id) return;
                            const newOrder = [...anchorOrder];
                            const draggedIdx = newOrder.findIndex(s => s.id === draggedSuggestion.id);
                            const targetIdx = index;
                            if (draggedIdx === -1 || targetIdx === -1) return;
                            newOrder.splice(draggedIdx, 1);
                            newOrder.splice(targetIdx, 0, draggedSuggestion);
                            setAnchorOrder(newOrder);
                          }}
                          onDragEnd={() => setDraggedSuggestion(null)}
                          className={`p-3 border rounded-lg transition cursor-move select-none ${
                            draggedSuggestion?.id === scene.id 
                              ? 'opacity-50 bg-blue-50 border-blue-300' 
                              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-gray-400 text-xs mt-0.5">{index + 1}.</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800 mb-1">{scene.name}</div>
                              <div className="text-xs text-gray-600">{scene.description}</div>
                              {scene.anchor_description && (
                                <div className="text-xs text-gray-500 mt-1 italic">● {scene.anchor_description}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {anchorOrder.length === 0 && (
                        <div className="text-sm text-gray-400 italic">No hay escenas de núcleo marcadas como ancla</div>
                      )}
                    </div>
                  </div>

                  {/* Desenlace */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-800">Desenlace</h3>
                      <span className="text-xs bg-stone-100 px-2 py-1 rounded">{closingSuggestions.length} escenas</span>
                    </div>
                    <div className="space-y-2">
                      {closingSuggestions.map((scene) => (
                        <div
                          key={scene.id}
                          className="p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition"
                        >
                          <div className="text-sm font-medium text-gray-800 mb-1">{scene.name}</div>
                          <div className="text-xs text-gray-600">{scene.description}</div>
                          {scene.anchor_description && (
                            <div className="text-xs text-gray-500 mt-1 italic">● {scene.anchor_description}</div>
                          )}
                        </div>
                      ))}
                      {closingSuggestions.length === 0 && (
                        <div className="text-sm text-gray-400 italic">No hay escenas de resolución marcadas como ancla</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-200 text-sm text-gray-600">
                  <span className="font-medium">Total sugerido:</span> {totalSuggested} escenas
                </div>
                
                {/* Sugerencias de Canciones */}
                {suggestedSongs.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-stone-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-xl text-gray-800">Sugerencias de Canciones</h3>
                      <span className="text-xs bg-purple-100 px-2 py-1 rounded">{suggestedSongs.length} {suggestedSongs.length === 1 ? 'canción' : 'canciones'}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {suggestedSongs.map((song, idx) => (
                          <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition">
                            <div className="text-sm font-medium text-gray-800 mb-1">{song.title}</div>
                            <div className="text-xs text-gray-600">{song.artist}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                )}
                </>
              )}
              </div>
            );
          })()}

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
                            draggable="true"
                            onDragStart={(e) => {
                              setDraggedScene(scene);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', scene.id.toString());
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!draggedScene || draggedScene.id === scene.id) return;
                              const newOrder = [...selectedScenes];
                              const draggedIdx = newOrder.indexOf(draggedScene.id);
                              const targetIdx = newOrder.indexOf(scene.id);
                              if (draggedIdx === -1 || targetIdx === -1) return;
                              newOrder.splice(draggedIdx, 1);
                              newOrder.splice(targetIdx, 0, draggedScene.id);
                              setSelectedScenes(newOrder);
                              if (activeVersion) saveVersionScenes(activeVersion.id, newOrder);
                            }}
                            onDragEnd={() => setDraggedScene(null)}
                            className={`px-3 py-2 bg-white rounded border border-stone-200 text-sm text-gray-700 cursor-move hover:border-gray-400 transition select-none ${
                              draggedScene?.id === scene.id ? 'opacity-50 bg-blue-50 border-blue-300' : ''
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
                              onDragStart={(e) => {
                                setDraggedScene(scene);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }}
                              onDrop={(e) => {
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
                              className={`border-b border-stone-200 hover:bg-white transition cursor-move select-none ${
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

export default VideosModule;
