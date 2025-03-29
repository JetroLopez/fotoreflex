
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir a inicio de sesión
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-studio-beige/10">
        <Loader2 className="h-8 w-8 animate-spin text-studio-brown" />
        <p className="mt-2 text-studio-brown">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario y no está cargando, no renderizar nada (la redirección ocurrirá en el useEffect)
  if (!user && !loading) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-4 md:px-6">
          <AdminSidebar isMobile={true} />
          <h1 className="text-xl font-semibold text-gray-800 md:ml-0 ml-4">
            Panel de Administración
          </h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
