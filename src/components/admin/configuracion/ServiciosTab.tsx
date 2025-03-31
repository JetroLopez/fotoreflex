import React, { useState, useEffect } from 'react';
import { supabase, updatePhotoService } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { PencilIcon, TrashIcon, PlusIcon, SaveIcon, LoaderIcon, AlertCircleIcon } from 'lucide-react';
import { PhotoService } from '@/types/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditablePhotoService extends PhotoService {
  isEdited?: boolean;
  isNew?: boolean;
}

const ServiciosTab = () => {
  const [services, setServices] = useState<EditablePhotoService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentService, setCurrentService] = useState<EditablePhotoService | null>(null);
  const [formData, setFormData] = useState<Omit<EditablePhotoService, 'id' | 'isEdited' | 'isNew'>>({
    description: '',
    base_price: 0,
    type: 'infantil',
    active: true,
    is_customizable: false,
    customization_note: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [servicesToDelete, setServicesToDelete] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Iniciando carga de datos...');
      
      // Verificar si la tabla photo_services existe
      const { data: tablesData, error: tablesError } = await supabase
        .from('photo_services')
        .select('count')
        .limit(1);
        
      if (tablesError && tablesError.code === '42P01') {
        // La tabla no existe
        console.error('La tabla photo_services no existe');
        toast({
          title: 'Error',
          description: 'No se pueden cargar los servicios. La tabla no está configurada.',
          variant: 'destructive'
        });
        setServices([]);
      } else {
        // Cargar servicios
        const { data: servicesData, error: servicesError } = await supabase
          .from('photo_services')
          .select('*');
          
        if (servicesError) {
          console.error('Error al cargar servicios:', servicesError);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar los servicios',
            variant: 'destructive'
          });
          setServices([]);
        } else {
          console.log('Servicios cargados:', servicesData);
          setServices(servicesData || []);
        }
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
    setCurrentService(null);
    setFormData({
      description: '',
      base_price: 0,
      type: 'infantil',
      active: true,
      is_customizable: false,
      customization_note: ''
    });
    setShowForm(true);
  };

  const handleEdit = (service: EditablePhotoService) => {
    setCurrentService(service);
    setFormData({
      description: service.description || '',
      base_price: service.base_price,
      type: service.type || 'infantil',
      active: service.active !== false,
      is_customizable: service.is_customizable || false,
      customization_note: service.customization_note || ''
    });
    setShowForm(true);
  };

  const handleDelete = (service: EditablePhotoService) => {
    setCurrentService(service);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!currentService) return;
    
    if (currentService.isNew) {
      // Si es un servicio nuevo que aún no está en la base de datos, solo eliminarlo del estado
      setServices(services.filter(s => s.id !== currentService.id));
    } else {
      // Marcar para eliminación en la base de datos cuando se guarden los cambios
      setServicesToDelete([...servicesToDelete, currentService.id]);
      setServices(services.filter(s => s.id !== currentService.id));
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
    
    if (!formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'La descripción del servicio es obligatoria.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validar el precio base
    if (formData.base_price < 0) {
      toast({
        title: 'Error',
        description: 'El precio base no puede ser negativo.',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentService) {
      // Editar existente
      const updatedService = { ...currentService, ...formData, isEdited: true };
      console.log("Servicio actualizado:", updatedService);
      
      setServices(services.map(s => 
        s.id === currentService.id 
          ? updatedService 
          : s
      ));
    } else {
      // Nuevo servicio
      const newService: EditablePhotoService = {
        id: `new-${Date.now()}`, // ID temporal
        ...formData,
        isNew: true
      };
      console.log("Nuevo servicio:", newService);
      setServices([...services, newService]);
    }
    
    setShowForm(false);
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    try {
      setIsSaving(true);
      let operationsSuccessful = true;
      let updatesApplied = 0;
      let totalUpdates = 0;
      
      // Crear copias locales para evitar problemas de sincronización
      const currentServices = [...services];
      const currentServicesToDelete = [...servicesToDelete];
      
      console.log('Estado actual de servicios:', currentServices);
      console.log('Servicios marcados para eliminar:', currentServicesToDelete);
      
      // 1. Eliminar servicios marcados para eliminación
      if (currentServicesToDelete.length > 0) {
        totalUpdates += currentServicesToDelete.length;
        
        // Eliminación sin usar options
        const { error: deleteError } = await supabase
          .from('photo_services')
          .delete()
          .in('id', currentServicesToDelete);
          
        console.log('Resultado de eliminación:', { deleteError });
          
        if (deleteError) {
          operationsSuccessful = false;
          console.error('Error al eliminar servicios:', deleteError);
          toast({
            title: 'Error',
            description: 'No se pudieron eliminar algunos servicios.',
            variant: 'destructive',
          });
        } else {
          updatesApplied += currentServicesToDelete.length;
          console.log('Eliminación exitosa');
        }
      }
      
      // 2. Agregar nuevos servicios
      const newServices = currentServices.filter(s => s.isNew);
      console.log('Nuevos servicios a agregar:', newServices);
      
      if (newServices.length > 0) {
        totalUpdates += newServices.length;
        
        const newServicesData = newServices.map(({ id, isNew, isEdited, ...data }) => ({
          ...data,
          type: data.type || 'infantil',
          base_price: Number(data.base_price)
        }));
        
        console.log('Datos de nuevos servicios a insertar:', newServicesData);
        
        try {
          // INSERT sin usar options
          const { error: insertError } = await supabase
            .from('photo_services')
            .insert(newServicesData);
            
          console.log('Resultado de inserción:', { insertError });
            
          if (insertError) {
            operationsSuccessful = false;
            console.error('Error al agregar servicios nuevos:', insertError);
            
            if (insertError.code === '42501') {
              toast({
                title: 'Error de permisos',
                description: 'No tienes suficientes permisos para agregar servicios. Contacta al administrador.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Error',
                description: 'No se pudieron agregar los nuevos servicios: ' + insertError.message,
                variant: 'destructive',
              });
            }
          } else {
            updatesApplied += newServices.length;
            console.log('Inserción exitosa');
          }
        } catch (err) {
          console.error('Error completo en try/catch:', err);
          operationsSuccessful = false;
          toast({
            title: 'Error',
            description: 'Error al intentar agregar nuevos servicios.',
            variant: 'destructive',
          });
        }
      }
      
      // 3. Actualizar servicios modificados
      const editedServices = currentServices.filter(s => s.isEdited && !s.isNew);
      console.log('Servicios a actualizar:', editedServices);
      
      if (editedServices.length > 0) {
        totalUpdates += editedServices.length;
        
        let updateSuccessCount = 0;
        
        for (const service of editedServices) {
          const { id, isEdited, isNew, ...data } = service;
          
          console.log(`Actualizando servicio ID ${id}:`, data);
          
          // Asegurar que tenemos todos los campos necesarios para la actualización
          const updateData = {
            description: data.description,
            base_price: Number(data.base_price),
            type: data.type || 'infantil',
            active: data.active === undefined ? true : data.active
          };
          
          if (data.is_customizable !== undefined) {
            updateData.is_customizable = data.is_customizable;
          }
          
          if (data.customization_note !== undefined) {
            updateData.customization_note = data.customization_note || '';
          }
          
          try {
            // UPDATE sin usar options
            const { error: updateError } = await supabase
              .from('photo_services')
              .update(updateData)
              .eq('id', id);
              
            if (!updateError) {
              updateSuccessCount++;
              console.log(`✅ Actualización exitosa para ID ${id}`);
            } else {
              console.log(`❌ Error al actualizar servicio ID ${id}:`, updateError);
              
              // Si falla, intentar con la función helper
              const updateResult = await updatePhotoService(id, updateData);
              
              if (updateResult.success) {
                updateSuccessCount++;
                console.log(`✅ Actualización exitosa para ID ${id} usando método alternativo: ${updateResult.method}`);
              } else {
                console.log(`❌ No se pudo actualizar el servicio ID ${id} después de intentar todos los métodos`);
              }
            }
          } catch (err) {
            console.error(`Error completo en try/catch para actualización ID ${id}:`, err);
          }
        }
        
        updatesApplied += updateSuccessCount;
        console.log(`Actualizaciones exitosas: ${updateSuccessCount} de ${editedServices.length}`);
        
        if (updateSuccessCount < editedServices.length) {
          operationsSuccessful = false;
          toast({
            title: 'Advertencia',
            description: `Solo se actualizaron ${updateSuccessCount} de ${editedServices.length} servicios.`,
            variant: 'destructive',
          });
        }
      }

      // Informar al usuario sobre el resultado de las operaciones
      if (totalUpdates === 0) {
        toast({
          title: 'Información',
          description: 'No se detectaron cambios para guardar.',
        });
      } else if (updatesApplied === totalUpdates) {
        toast({
          title: 'Éxito',
          description: `Se aplicaron todos los cambios (${updatesApplied} operaciones).`,
        });
      } else {
        toast({
          title: 'Advertencia',
          description: `Solo se aplicaron ${updatesApplied} de ${totalUpdates} cambios.`,
          variant: 'destructive',
        });
      }
      
      // Limpiar el estado de eliminación
      setServicesToDelete([]);
      
      // Cargar datos actualizados directamente
      await fetchData();
      setHasChanges(false);
      
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar los cambios. Por favor, verifica los datos e intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Servicios Fotográficos</h2>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleAddNew}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Servicio
          </Button>
          {hasChanges && (
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={saveAllChanges}
              disabled={isSaving}
            >
              {isSaving ? (
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
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay servicios configurados. Haz clic en "Agregar Servicio" para crear uno.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Precio Base</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map(service => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.description || ''}</TableCell>
                  <TableCell>{service.type || 'infantil'}</TableCell>
                  <TableCell className="text-right">${service.base_price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    {service.active !== false ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(service)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(service)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription>
              {currentService 
                ? 'Modifica la información del servicio fotográfico.' 
                : 'Ingresa la información para crear un nuevo servicio fotográfico.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Servicio</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ej. Sesión Infantil en estudio"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Servicio</Label>
                <Select 
                  value={formData.type || 'infantil'} 
                  onValueChange={(value) => handleChange({ target: { name: 'type', value } })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecciona un tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infantil">Infantil</SelectItem>
                    <SelectItem value="ovalada">Ovalada</SelectItem>
                    <SelectItem value="credencial">Credencial</SelectItem>
                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="grupal">Grupal</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="restauracion">Restauración</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
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
                    onCheckedChange={(checked) => handleChange({
                      target: {
                        name: 'active',
                        value: checked,
                        type: 'checkbox'
                      }
                    } as React.ChangeEvent<HTMLInputElement>)}
                  />
                  <Label htmlFor="active" className="cursor-pointer">Servicio Activo</Label>
                </div>
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
              Esta acción eliminará el servicio "{currentService?.description}" y no se puede deshacer.
              Al eliminar un servicio también se eliminarán las opciones asociadas a él.
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

export default ServiciosTab; 