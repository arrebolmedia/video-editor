const API_BASE_URL = import.meta.env.PROD ? '/editor-api' : '';

export const API = {
  health: `${API_BASE_URL}/api/health`,
  projects: `${API_BASE_URL}/api/projects`,
  scenes: `${API_BASE_URL}/api/scenes`,
  versions: `${API_BASE_URL}/api/versions`,
  
  project: (id: number) => `${API_BASE_URL}/api/projects/${id}`,
  projectScenes: (id: number) => `${API_BASE_URL}/api/projects/${id}/scenes`,
  versionScenes: (id: number) => `${API_BASE_URL}/api/versions/${id}/scenes`,
};
