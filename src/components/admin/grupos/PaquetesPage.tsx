import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PhotoPackage } from '@/types/supabase';
import NuevoPaqueteDialog from './NuevoPaqueteDialog';
import EditarPaqueteDialog from './EditarPaqueteDialog';
import DetallesPaqueteDialog from './DetallesPaqueteDialog';

const PaquetesPage = () => {
  const [packages, setPackages] = useState<PhotoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuevoPaqueteDialog, setShowNuevoPaqueteDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showDetallesDialog, setShowDetallesDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PhotoPackage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPackages(data || []);
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  // Filtrar paquetes
  const filteredPackages = packages.filter(pkg => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pkg.name.toLowerCase().includes(searchLower) ||
      pkg.description.toLowerCase().includes(searchLower)
    );
  });

  const handleVerDetalles = (pkg: PhotoPackage) => {
    setSelectedPackage(pkg);
    setShowDetallesDialog(true);
  };

  const handleEditar = (pkg: PhotoPackage) => {
    setSelectedPackage(pkg);
    setShowEditarDialog(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Paquetes Fotográficos</h1>
        <Button onClick={() => setShowNuevoPaqueteDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Paquete
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de paquetes */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse text-gray-500">Cargando paquetes...</div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron paquetes</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pkg.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {pkg.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-lg font-semibold">{formatPrice(pkg.base_price)}</p>
                {pkg.options && pkg.options.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {pkg.options.length} {pkg.options.length === 1 ? 'opción adicional' : 'opciones adicionales'}
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVerDetalles(pkg)}
                >
                  <Eye className="h-4 w-4 mr-2" /> Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditar(pkg)}
                >
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diálogos */}
      <NuevoPaqueteDialog
        open={showNuevoPaqueteDialog}
        onOpenChange={setShowNuevoPaqueteDialog}
        onSuccess={() => {
          fetchPackages();
          setShowNuevoPaqueteDialog(false);
        }}
      />

      <EditarPaqueteDialog
        open={showEditarDialog}
        onOpenChange={setShowEditarDialog}
        package={selectedPackage}
        onSuccess={() => {
          fetchPackages();
          setShowEditarDialog(false);
        }}
      />

      <DetallesPaqueteDialog
        open={showDetallesDialog}
        onOpenChange={setShowDetallesDialog}
        package={selectedPackage}
      />
    </div>
  );
};

export default PaquetesPage; 