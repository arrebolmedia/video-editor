const API_BASE_URL = '/api';

// Base URL for previews - uses current origin in production
export const PREVIEW_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000' 
  : 'https://arrebolweddings.com';

export const API = {
  health: `${API_BASE_URL}/health`,
  login: `${API_BASE_URL}/login`,
  projects: `${API_BASE_URL}/projects`,
  scenes: `${API_BASE_URL}/scenes`,
  versions: `${API_BASE_URL}/versions`,
  landings: `${API_BASE_URL}/landings`,
  landingsPreview: `${API_BASE_URL}/landings/preview`,
  landingsSeed: `${API_BASE_URL}/landings/seed`,
  
  project: (id: number) => `${API_BASE_URL}/projects/${id}`,
  projectScenes: (id: number) => `${API_BASE_URL}/projects/${id}/scenes`,
  versionScenes: (id: number) => `${API_BASE_URL}/versions/${id}/scenes`,
};
