import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Receipt, UsersRound, PieChart, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import NuevaOrdenDialog from '@/components/admin/ordenes/NuevaOrdenDialog';

type Order = {
  id: string;
  folio: string;
  created_at: string;
  total_price: number;
  status: string;
  priority: 'normal' | 'urgente';
  customer: {
    name: string;
    phone: string;
  } | null;
};

type Group = {
  id: string;
  name: string;
  delivery_date: string;
  status: string;
};

// Formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalClientes: 0,
    nuevosClientes: 0,
    totalOrdenes: 0,
    ordenesPendientes: 0,
    gruposActivos: 0,
    gruposPendientes: 0,
    gruposEnProceso: 0,
    ordenesUltimos30Dias: 0,
    loading: true,
    actividadReciente: [] as Order[],
    proximasEntregas: [] as Group[],
    ordenesEstado: {
      pendiente: 0,
      en_proceso: 0,
      completado: 0,
      entregado: 0,
      cancelado: 0
    }
  });
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const navigate = useNavigate();

  // Función para obtener el nombre de usuario
  const getUserName = () => {
    if (profile?.first_name) return profile.first_name;
    return 'Usuario';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fecha hace 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        // Fecha hace 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();

        // Total de clientes
        const { count: totalClientes } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        // Nuevos clientes en los últimos 30 días
        const { count: nuevosClientes } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgoStr);

        // Órdenes en los últimos 30 días
        const { count: ordenesUltimos30Dias } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgoStr);

        // Grupos activos (todos excepto entregados y cancelados)
        const { data: gruposActivos, error: errorGruposActivos } = await supabase
          .from('groups')
          .select('id')
          .not('status', 'in', '(entregado,cancelado)');

        // Órdenes por estado (últimos 7 días)
        const { data: ordenesEstado } = await supabase
          .from('orders')
          .select('status')
          .gte('created_at', sevenDaysAgoStr);

        // Actividad reciente (últimos 7 días)
        const { data: actividadReciente } = await supabase
          .from('orders')
          .select(`
            id,
            folio,
            created_at,
            status,
            total_price,
            priority,
            customer:customers!inner(name, phone)
          `)
          .gte('created_at', sevenDaysAgoStr)
          .order('created_at', { ascending: false })
          .limit(5) as { data: Order[] };

        // Contar órdenes por estado
        const estadoCount = {
          pendiente: 0,
          en_proceso: 0,
          completado: 0,
          entregado: 0,
          cancelado: 0
        };
        ordenesEstado?.forEach(orden => {
          estadoCount[orden.status] = (estadoCount[orden.status] || 0) + 1;
        });

        // Grupos por estado
        const { data: gruposPendientes, error: errorPendientes } = await supabase
          .from('groups')
          .select('id')
          .eq('status', 'pendiente');

        const { data: gruposEnProceso, error: errorEnProceso } = await supabase
          .from('groups')
          .select('id')
          .eq('status', 'en_proceso');

        if (errorGruposActivos || errorPendientes || errorEnProceso) {
          console.error("Error al obtener grupos:", { 
            errorGruposActivos, 
            errorPendientes, 
            errorEnProceso 
          });
        }

        // Próximas entregas
        const { data: proximasEntregas } = await supabase
          .from('groups')
          .select('id, name, delivery_date, status')
          .not('status', 'in', '(entregado,cancelado)')
          .order('delivery_date', { ascending: true })
          .limit(3);

        setStats({
          totalClientes: totalClientes || 0,
          nuevosClientes: nuevosClientes || 0,
          totalOrdenes: 0,
          ordenesPendientes: 0,
          ordenesUltimos30Dias: ordenesUltimos30Dias || 0,
          gruposActivos: gruposActivos?.length || 0,
          gruposPendientes: gruposPendientes?.length || 0,
          gruposEnProceso: gruposEnProceso?.length || 0,
          loading: false,
          actividadReciente: actividadReciente || [],
          proximasEntregas: proximasEntregas || [],
          ordenesEstado: estadoCount
        });

      } catch (error) {
        console.error("Error en fetchStats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'entregado': return 'bg-purple-100 text-purple-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'completado': return 'Completado';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  if (stats.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-studio-brown" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Bienvenido, {getUserName()}
          </h2>
          <p className="text-gray-500">
            Aquí puedes ver un resumen de la actividad de Foto Réflex.
          </p>
        </div>
        <Button 
          onClick={() => setShowNuevaOrdenDialog(true)}
          className="px-6 py-6 text-base"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Nueva Orden
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Clientes" 
          value={stats.totalClientes}
          subValue={stats.nuevosClientes > 0 ? `+${stats.nuevosClientes}` : undefined}
          icon={<Users className="h-8 w-8 text-blue-500" />} 
          description="Total de clientes" 
          subDescription="Nuevos este mes"
        />
        <StatCard 
          title="Órdenes" 
          value={stats.ordenesUltimos30Dias} 
          icon={<Receipt className="h-8 w-8 text-emerald-500" />} 
          description="Últimos 30 días" 
        />
        <StatCard 
          title="Grupos" 
          value={stats.gruposActivos} 
          icon={<UsersRound className="h-8 w-8 text-amber-500" />} 
          description="Grupos activos" 
        />
        <StatCard 
          title="Tendencia" 
          value={`${Math.round((stats.ordenesUltimos30Dias / 30) * 7)}` || '0'} 
          icon={<TrendingUp className="h-8 w-8 text-purple-500" />} 
          description="Órdenes/semana" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Órdenes Urgentes</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/ordenes')}
              className="text-studio-brown hover:text-studio-brown/90"
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {stats.actividadReciente.filter(orden => 
              orden.priority === 'urgente' && 
              (orden.status === 'pendiente' || orden.status === 'en_proceso')
            ).length > 0 ? (
              <div className="space-y-4">
                {stats.actividadReciente
                  .filter(orden => 
                    orden.priority === 'urgente' && 
                    (orden.status === 'pendiente' || orden.status === 'en_proceso')
                  )
                  .slice(0, 5)
                  .map((actividad) => (
                    <div key={actividad.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{actividad.customer?.name}</p>
                        <p className="text-xs text-gray-500">Folio: {actividad.folio}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(actividad.status)}`}>
                        {getStatusLabel(actividad.status)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 flex items-center justify-center h-32">
                No hay órdenes urgentes pendientes o en proceso.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grupos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {stats.gruposPendientes || 0}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">En Proceso</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.gruposEnProceso || 0}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Próximas Entregas</span>
                  <span className="text-xs text-gray-500">Fecha límite</span>
                </div>
                {stats.proximasEntregas?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.proximasEntregas.map((grupo) => (
                      <div key={grupo.id} className="flex items-center justify-between">
                        <span className="text-sm">{grupo.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(grupo.delivery_date)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No hay entregas próximas
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <NuevaOrdenDialog 
        open={showNuevaOrdenDialog} 
        onOpenChange={setShowNuevaOrdenDialog} 
      />
    </div>
  );
};

// Definir interfaz para las props del StatCard
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  subValue?: string;
  subDescription?: string;
  disabled?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  subValue, 
  icon, 
  description, 
  subDescription,
  disabled
}: StatCardProps) => {
  return (
    <Card className={disabled ? "opacity-50" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-bold text-gray-900 mt-1">{value}</h4>
              {subValue && (
                <span className="text-sm font-medium text-green-500">{subValue}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
            {subDescription && (
              <p className="text-xs text-gray-400">{subDescription}</p>
            )}
          </div>
          <div>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
