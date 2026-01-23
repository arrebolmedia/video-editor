import { ReactNode } from 'react';

interface Module {
  id: string;
  name: string;
  icon: string;
  path: string;
  requiredRole: 'admin' | 'editor';
}

interface ModuleLayoutProps {
  children: ReactNode;
  currentModule: string;
  userRole: string;
  userName: string;
  onLogout: () => void;
  onModuleChange: (moduleId: string) => void;
}

export const MODULES: Module[] = [
  {
    id: 'videos',
    name: 'Editor de Videos',
    icon: '',
    path: '/videos',
    requiredRole: 'editor'
  },
  {
    id: 'landings',
    name: 'Landings',
    icon: '',
    path: '/landings',
    requiredRole: 'admin'
  },
  {
    id: 'contratos',
    name: 'Contratos',
    icon: '📄',
    path: '/contratos',
    requiredRole: 'admin'
  },
  {
    id: 'recibos',
    name: 'Recibos',
    icon: '',
    path: '/recibos',
    requiredRole: 'admin'
  }
];

export default function ModuleLayout({ 
  children, 
  currentModule, 
  userRole,
  userName,
  onLogout,
  onModuleChange 
}: ModuleLayoutProps) {
  
  const availableModules = MODULES.filter(module => 
    userRole === 'admin' || module.requiredRole === 'editor'
  );

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-stone-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <h1 className="text-xl font-bold text-gray-800">Arrebol Suite</h1>
          <p className="text-sm text-gray-500 mt-1">{userName}</p>
        </div>

        {/* Modules */}
        <nav className="flex-1 p-4 space-y-2">
          {availableModules.map(module => (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                currentModule === module.id
                  ? 'bg-stone-800 text-white'
                  : 'text-gray-700 hover:bg-stone-100'
              }`}
            >
              <span className="font-medium">{module.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-stone-200">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
