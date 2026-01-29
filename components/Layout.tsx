
import React from 'react';
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { gymName, gymLogo } = useApp();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Barra Lateral Escritorio */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-10 px-2 overflow-hidden">
          {gymLogo ? (
            <img src={gymLogo} alt="Logo" className="w-10 h-10 object-cover rounded-xl shadow-md" />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {gymName.charAt(0)}
            </div>
          )}
          <span className="text-xl font-bold tracking-tight truncate">{gymName}</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Panel de Control" 
            active={currentView === 'dashboard'} 
            onClick={() => setView('dashboard')}
          />
          <SidebarItem 
            icon={<Calendar size={20} />} 
            label="Agenda" 
            active={currentView === 'agenda'} 
            onClick={() => setView('agenda')}
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Alumnos" 
            active={currentView === 'students'} 
            onClick={() => setView('students')}
          />
          <SidebarItem 
            icon={<Wallet size={20} />} 
            label="Finanzas" 
            active={currentView === 'finances'} 
            onClick={() => setView('finances')}
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Configuración" 
            active={currentView === 'settings'} 
            onClick={() => setView('settings')}
          />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="Cerrar Sesión" 
            onClick={() => {}} 
          />
        </div>
      </aside>

      {/* Encabezado Móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-50">
        <div className="flex items-center space-x-2">
          {gymLogo ? (
            <img src={gymLogo} alt="Logo" className="w-8 h-8 object-cover rounded-lg" />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">{gymName.charAt(0)}</div>
          )}
          <span className="font-bold truncate max-w-[150px]">{gymName}</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Menú Desplegable Móvil */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <aside className="w-64 h-full bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
             <nav className="space-y-2 pt-16">
                <SidebarItem icon={<LayoutDashboard size={20} />} label="Panel de Control" active={currentView === 'dashboard'} onClick={() => { setView('dashboard'); setIsOpen(false); }} />
                <SidebarItem icon={<Calendar size={20} />} label="Agenda" active={currentView === 'agenda'} onClick={() => { setView('agenda'); setIsOpen(false); }} />
                <SidebarItem icon={<Users size={20} />} label="Alumnos" active={currentView === 'students'} onClick={() => { setView('students'); setIsOpen(false); }} />
                <SidebarItem icon={<Wallet size={20} />} label="Finanzas" active={currentView === 'finances'} onClick={() => { setView('finances'); setIsOpen(false); }} />
                <SidebarItem icon={<Settings size={20} />} label="Configuración" active={currentView === 'settings'} onClick={() => { setView('settings'); setIsOpen(false); }} />
             </nav>
          </aside>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
