import { useState, useEffect } from 'react';
import Login from './Login';
import ModuleLayout from './components/ModuleLayout';
import LandingsModule from './modules/LandingsModule';
import ContratosModule from './modules/ContratosModule';
import RecibosModule from './modules/RecibosModule';
import VideosModule from './modules/VideosModule';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const authValue = localStorage.getItem('auth');
    const authVersion = localStorage.getItem('authVersion');
    if (authValue === 'true' && authVersion !== '2') {
      localStorage.clear();
      return false;
    }
    return authValue === 'true' && authVersion === '2';
  });

  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [currentModule, setCurrentModule] = useState(() => localStorage.getItem('currentModule') || 'videos');

  const handleLogin = (email: string, name: string, role: string) => {
    localStorage.setItem('auth', 'true');
    localStorage.setItem('authVersion', '2');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserName(name);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    window.location.reload();
  };

  const handleModuleChange = (moduleId: string) => {
    setCurrentModule(moduleId);
    localStorage.setItem('currentModule', moduleId);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'videos':
        return <VideosModule userEmail={userEmail} userName={userName} userRole={userRole} />;
      case 'landings':
        return <LandingsModule />;
      case 'contratos':
        return <ContratosModule />;
      case 'recibos':
        return <RecibosModule />;
      default:
        return <VideosModule userEmail={userEmail} userName={userName} userRole={userRole} />;
    }
  };

  return (
    <ModuleLayout
      currentModule={currentModule}
      userRole={userRole}
      userName={userName}
      onLogout={handleLogout}
      onModuleChange={handleModuleChange}
    >
      {renderModule()}
    </ModuleLayout>
  );
}

export default App;
