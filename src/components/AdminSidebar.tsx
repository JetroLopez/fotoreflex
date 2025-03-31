import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  Camera,
  UsersRound,
  Cog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
}

const SidebarItem = ({ to, icon, label, isActive, onClick, disabled }: SidebarItemProps) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-studio-brown text-white'
        : 'text-gray-700 hover:bg-studio-brown/10'
    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    onClick={onClick}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </Link>
);

interface AdminSidebarProps {
  isMobile?: boolean;
}

const AdminSidebar = ({ isMobile = false }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  // Función para obtener el nombre de usuario
  const getUserName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    } else if (profile?.first_name) {
      return profile.first_name;
    }
    return 'Usuario';
  };

  // Función para obtener el rol del usuario
  const getUserRole = () => {
    if (!profile?.role) return 'Usuario';
    
    switch (profile.role) {
      case 'admin': return 'Administrador';
      case 'operator': return 'Operador';
      case 'operador': return 'Operador';
      default: return profile.role;
    }
  };

  const routes = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: '/admin/ordenes',
      label: 'Órdenes',
      icon: <Receipt size={20} />,
    },
    {
      path: '/admin/clientes',
      label: 'Clientes',
      icon: <Users size={20} />,
    },
    {
      path: '/admin/grupos',
      label: 'Grupos',
      icon: <UsersRound size={20} />,
    },
    {
      path: '/admin/fotografias',
      label: 'Fotografías',
      icon: <ImageIcon size={20} />,
      disabled: true,
    },
    {
      path: '/admin/ajustes',
      label: 'Ajustes',
      icon: <Settings size={20} />,
    },
    {
      path: '/admin/configuracion',
      label: 'Configuración',
      icon: <Cog size={20} />,
      adminOnly: true,
    },
  ];

  const isAdmin = profile?.role === 'admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center space-x-2">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Vanamo_Logo.svg/480px-Vanamo_Logo.svg.png" 
          alt="Foto Réflex Logo" 
          className="h-6 w-6 object-contain"
        />
        <span className="font-playfair font-bold text-xl text-studio-brown">Foto Réflex</span>
      </div>
      
      <div className="px-3 py-2">
        <div className="bg-studio-beige/20 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-600">Conectado como</p>
          <p className="font-medium text-studio-brown">
            {getUserName()}
          </p>
          <p className="text-xs text-gray-500 capitalize">{getUserRole()}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {routes.map((route) => {
          // Si la ruta es de ajustes y el usuario no es admin, o si es fotografías, no mostrarla
          if ((route.path === '/admin/ajustes' && !isAdmin) || 
              route.path === '/admin/fotografias') {
            return null;
          }
          
          return (
            <SidebarItem
              key={route.path}
              to={route.disabled ? "#" : route.path}
              icon={route.icon}
              label={route.label}
              isActive={location.pathname === route.path}
              onClick={route.disabled ? (e) => e.preventDefault() : undefined}
              disabled={route.disabled}
            />
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 border-gray-300"
          onClick={signOut}
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="text-left px-4 py-2 border-b">
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-screen w-64 bg-white border-r flex-col">
      <SidebarContent />
    </div>
  );
};

export default AdminSidebar;
