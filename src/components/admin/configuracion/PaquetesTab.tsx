import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { PencilIcon, TrashIcon, PlusIcon, SaveIcon, LoaderIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CustomPhotoPackage {
  id: string;
  name: string;
  description: string;
  base_price: number;
  active: boolean;
  isEdited?: boolean;
  isNew?: boolean;
}

const PaquetesTab = () => {
  const [packages, setPackages] = useState<CustomPhotoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<CustomPhotoPackage | null>(null);
  const [formData, setFormData] = useState<Omit<CustomPhotoPackage, 'id' | 'isEdited' | 'isNew'>>({
    name: '',
    description: '',
    base_price: 0,
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [packagesToDelete, setPackagesToDelete] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar paquetes
      const { data: packagesData, error: packagesError } = await supabase
        .from('photo_packages')
        .select('*')
        .order('name', { ascending: true });
        
      if (packagesError) {
        console.error('Error al cargar paquetes:', packagesError);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los paquetes',
          variant: 'destructive'
        });
        setPackages([]);
      } else {
        setPackages(packagesData || []);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado al cargar los datos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setCurrentPackage(null);
    setFormData({
      name: '',
      description: '',
      base_price: 0,
      active: true
    });
    setShowForm(true);
  };

  const handleEdit = (pkg: CustomPhotoPackage) => {
    setCurrentPackage(pkg);
    setFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      base_price: pkg.base_price || 0,
      active: pkg.active !== false // Por defecto true si no está definido
    });
    setShowForm(true);
  };

  const handleDelete = (pkg: CustomPhotoPackage) => {
    setCurrentPackage(pkg);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!currentPackage) return;
    
    if (currentPackage.isNew) {
      // Si es un paquete nuevo que aún no está en la base de datos, solo eliminarlo del estado
      setPackages(packages.filter(p => p.id !== currentPackage.id));
    } else {
      // Marcar para eliminación en la base de datos cuando se guarden los cambios
      setPackagesToDelete([...packagesToDelete, currentPackage.id]);
      setPackages(packages.filter(p => p.id !== currentPackage.id));
    }
    
    setShowDeleteDialog(false);
    setHasChanges(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'base_price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del paquete es obligatorio.',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentPackage) {
      // Editar existente
      setPackages(packages.map(p => 
        p.id === currentPackage.id 
          ? { ...p, ...formData, isEdited: true } 
          : p
      ));
    } else {
      // Nuevo paquete
      const newPackage: CustomPhotoPackage = {
        id: `new-${Date.now()}`, // ID temporal
        ...formData,
        isNew: true
      };
      setPackages([...packages, newPackage]);
    }
    
    setShowForm(false);
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      let operationsSuccessful = true;
      
      // 1. Eliminar paquetes marcados para eliminación
      if (packagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('photo_packages')
          .delete()
          .in('id', packagesToDelete);
          
        if (deleteError) {
          operationsSuccessful = false;
          console.error('Error al eliminar paquetes:', deleteError);
          toast({
            title: 'Error',
            description: 'No se pudieron eliminar algunos paquetes.',
            variant: 'destructive',
          });
        }
      }
      
      // 2. Agregar nuevos paquetes
      const newPackages = packages.filter(p => p.isNew);
      if (newPackages.length > 0) {
        const newPackagesData = newPackages.map(({ id, isNew, isEdited, ...data }) => ({
          ...data,
          base_price: Number(data.base_price) || 0,
          active: Boolean(data.active)
        }));
        
        const { error: insertError } = await supabase
          .from('photo_packages')
          .insert(newPackagesData);
          
        if (insertError) {
          operationsSuccessful = false;
          console.error('Error al agregar paquetes nuevos:', insertError);
          toast({
            title: 'Error',
            description: 'No se pudieron agregar los nuevos paquetes.',
            variant: 'destructive',
          });
        }
      }
      
      // 3. Actualizar paquetes modificados
      const editedPackages = packages.filter(p => p.isEdited && !p.isNew);
      for (const pkg of editedPackages) {
        const { id, isEdited, isNew, ...data } = pkg;
        
        const { error: updateError } = await supabase
          .from('photo_packages')
          .update({
            ...data,
            base_price: Number(data.base_price) || 0,
            active: Boolean(data.active)
          })
          .eq('id', id);
          
        if (updateError) {
          operationsSuccessful = false;
          console.error('Error al actualizar paquete:', updateError);
          toast({
            title: 'Error',
            description: `No se pudo actualizar el paquete: ${pkg.name}`,
            variant: 'destructive',
          });
        }
      }

      toast({
        title: operationsSuccessful ? 'Éxito' : 'Advertencia',
        description: operationsSuccessful 
          ? 'Los cambios se han guardado correctamente.' 
          : 'Algunos cambios no pudieron guardarse. Los datos han sido actualizados parcialmente.',
        variant: operationsSuccessful ? 'default' : 'destructive',
      });

      // Limpiar el estado de eliminación
      setPackagesToDelete([]);
      
      // Actualizar datos directamente de la fuente
      await fetchData();
      setHasChanges(false);
      
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Paquetes Fotográficos</h2>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleAddNew}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Paquete
          </Button>
          {hasChanges && (
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={saveAllChanges}
              disabled={saving}
            >
              {saving ? (
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay paquetes configurados. Haz clic en "Agregar Paquete" para crear uno.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Precio Base</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map(pkg => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name || ''}</TableCell>
                  <TableCell>{pkg.description || ''}</TableCell>
                  <TableCell className="text-right">${pkg.base_price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-center">
                    {pkg.active ? '✓' : '✗'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(pkg)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(pkg)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Diálogo de formulario para agregar/editar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {currentPackage ? 'Editar Paquete' : 'Agregar Nuevo Paquete'}
            </DialogTitle>
            <DialogDescription>
              {currentPackage 
                ? 'Modifica la información del paquete fotográfico.' 
                : 'Ingresa la información para crear un nuevo paquete fotográfico.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Paquete</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Paquete Básico"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe el paquete"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="base_price">Precio Base ($)</Label>
                <Input
                  id="base_price"
                  name="base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    name="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        active: checked
                      }));
                    }}
                  />
                  <Label htmlFor="active">Paquete Activo</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Desmarca esta opción para ocultar temporalmente el paquete sin eliminarlo
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el paquete "{currentPackage?.name}" y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaquetesTab; 