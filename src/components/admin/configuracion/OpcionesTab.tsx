import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { PencilIcon, TrashIcon, PlusIcon, SaveIcon, LoaderIcon, AlertCircleIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PhotoService, ServiceOption } from '@/types/supabase';
import { Checkbox } from '@/components/ui/checkbox';

interface EditableServiceOption extends ServiceOption {
  isEdited?: boolean;
  isNew?: boolean;
}

const OpcionesTab = () => {
  const [options, setOptions] = useState<EditableServiceOption[]>([]);
  const [services, setServices] = useState<PhotoService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentOption, setCurrentOption] = useState<EditableServiceOption | null>(null);
  const [formData, setFormData] = useState<Omit<EditableServiceOption, 'id' | 'isEdited' | 'isNew' | 'created_at' | 'updated_at'>>({
    service_id: '',
    option_name: '',
    option_type: 'dropdown',
    choices: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [optionsToDelete, setOptionsToDelete] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar servicios
      const { data: servicesData, error: servicesError } = await supabase
        .from('photo_services')
        .select('*')
        .order('description', { ascending: true });
        
      if (servicesError) {
        console.error('Error al cargar servicios:', servicesError);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los servicios',
          variant: 'destructive'
        });
        setServices([]);
      } else {
        setServices(servicesData || []);
      }

      // Cargar opciones 
      const { data: optionsData, error: optionsError } = await supabase
        .from('service_options')
        .select('*');
        
      if (optionsError) {
        console.error('Error al cargar opciones:', optionsError);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las opciones',
          variant: 'destructive'
        });
        setOptions([]);
      } else {
        setOptions(optionsData || []);
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
    setCurrentOption(null);
    setFormData({
      service_id: services.length > 0 ? services[0].id : '',
      option_name: '',
      option_type: 'dropdown',
      choices: ''
    });
    setShowForm(true);
  };

  const handleEdit = (option: EditableServiceOption) => {
    setCurrentOption(option);
    let processedChoices = option.choices;
    
    // Si es un string, intentar parsearlo como JSON
    if (typeof processedChoices === 'string') {
      try {
        const parsed = JSON.parse(processedChoices);
        // Si es un array de strings (formato incorrecto), convertirlo a objeto
        if (Array.isArray(parsed)) {
          const joinedString = parsed.join('');
          try {
            processedChoices = JSON.parse(joinedString);
          } catch {
            processedChoices = parsed;
          }
        } else {
          processedChoices = parsed;
        }
      } catch (e) {
        processedChoices = option.choices;
      }
    }

    // Convertir el objeto a string formateado
    const choicesText = typeof processedChoices === 'object' 
      ? JSON.stringify(processedChoices, null, 2)
      : String(processedChoices);
    
    setFormData({
      service_id: option.service_id,
      option_name: option.option_name || '',
      option_type: option.option_type || 'dropdown',
      choices: choicesText
    });
    setShowForm(true);
  };

  const handleDelete = (option: EditableServiceOption) => {
    setCurrentOption(option);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!currentOption) return;
    
    if (currentOption.isNew) {
      // Si es una opción nueva que aún no está en la base de datos, solo eliminarla del estado
      setOptions(options.filter(o => o.id !== currentOption.id));
    } else {
      // Marcar para eliminación en la base de datos cuando se guarden los cambios
      setOptionsToDelete([...optionsToDelete, currentOption.id]);
      setOptions(options.filter(o => o.id !== currentOption.id));
    }
    
    setShowDeleteDialog(false);
    setHasChanges(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[] | any } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.option_name.trim() || !formData.service_id) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    // Procesar las opciones según el tipo
    let processedChoices;
    if (formData.option_type === 'dropdown') {
      try {
        // Intentar parsear como JSON primero
        processedChoices = JSON.parse(formData.choices);
      } catch {
        // Si no es JSON válido, dividir por líneas y crear objeto
        const lines = formData.choices
          .split('\n')
          .map(line => line.trim())
          .filter(line => line !== '');
          
        if (lines.length > 0) {
          // Verificar si las líneas tienen formato "clave: valor"
          const hasKeyValueFormat = lines.some(line => line.includes(':'));
          
          if (hasKeyValueFormat) {
            // Crear objeto a partir de las líneas
            processedChoices = {};
            lines.forEach(line => {
              const [key, value] = line.split(':').map(part => part.trim());
              if (key && value) {
                processedChoices[key.replace(/['"]/g, '')] = Number(value.replace(/[,}]/g, ''));
              }
            });
          } else {
            // Usar array simple si no hay formato clave:valor
            processedChoices = lines;
          }
        }
      }
    } else {
      // Para checkbox, usar el texto tal cual
      processedChoices = formData.choices.trim();
    }

    const finalFormData = {
      ...formData,
      choices: processedChoices
    };

    if (currentOption) {
      // Editar existente
      setOptions(options.map(o => 
        o.id === currentOption.id 
          ? { ...o, ...finalFormData, isEdited: true } 
          : o
      ));
    } else {
      // Nueva opción
      const newOption: EditableServiceOption = {
        id: `new-${Date.now()}`, // ID temporal
        ...finalFormData,
        isNew: true
      };
      setOptions([...options, newOption]);
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
      const currentOptions = [...options];
      const currentOptionsToDelete = [...optionsToDelete];
      
      // 1. Eliminar opciones marcadas para eliminación
      if (currentOptionsToDelete.length > 0) {
        totalUpdates += currentOptionsToDelete.length;
        
        const { error: deleteError } = await supabase
          .from('service_options')
          .delete()
          .in('id', currentOptionsToDelete);
          
        if (deleteError) {
          operationsSuccessful = false;
          console.error('Error al eliminar opciones:', deleteError);
          toast({
            title: 'Error',
            description: 'No se pudieron eliminar algunas opciones.',
            variant: 'destructive',
          });
        } else {
          updatesApplied += currentOptionsToDelete.length;
        }
      }
      
      // 2. Agregar nuevas opciones
      const newOptions = currentOptions.filter(o => o.isNew);
      if (newOptions.length > 0) {
        totalUpdates += newOptions.length;
        
        const newOptionsData = newOptions.map(({ id, isNew, isEdited, ...data }) => ({
          ...data,
          choices: data.choices
        }));
        
        const { error: insertError } = await supabase
          .from('service_options')
          .insert(newOptionsData);
          
        if (insertError) {
          operationsSuccessful = false;
          console.error('Error al agregar opciones nuevas:', insertError);
          toast({
            title: 'Error',
            description: 'No se pudieron agregar las nuevas opciones: ' + insertError.message,
            variant: 'destructive',
          });
        } else {
          updatesApplied += newOptions.length;
        }
      }
      
      // 3. Actualizar opciones modificadas
      const editedOptions = currentOptions.filter(o => o.isEdited && !o.isNew);
      
      if (editedOptions.length > 0) {
        totalUpdates += editedOptions.length;
        
        let updateSuccessCount = 0;
        
        for (const option of editedOptions) {
          const { id, isEdited, isNew, ...data } = option;
          
          const { error: updateError } = await supabase
            .from('service_options')
            .update(data)
            .eq('id', id);
            
          if (updateError) {
            console.error(`Error al actualizar opción ID ${id}:`, updateError);
          } else {
            updateSuccessCount++;
          }
        }
          
        updatesApplied += updateSuccessCount;
        
        if (updateSuccessCount < editedOptions.length) {
          operationsSuccessful = false;
          toast({
            title: 'Advertencia',
            description: `Solo se actualizaron ${updateSuccessCount} de ${editedOptions.length} opciones.`,
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
          description: `Los cambios se han guardado correctamente (${updatesApplied} operaciones).`,
        });
      } else {
        toast({
          title: 'Advertencia',
          description: `Solo se aplicaron ${updatesApplied} de ${totalUpdates} cambios. Los datos han sido actualizados parcialmente.`,
          variant: 'destructive',
        });
      }

      // Limpiar el estado de eliminación
      setOptionsToDelete([]);
      
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
      setIsSaving(false);
    }
  };

  // Agregar una nueva función para renderizar las opciones de manera más visual
  const formatChoices = (choices: any, optionType: string = 'dropdown') => {
    if (!choices) return <span className="text-muted-foreground">-</span>;

    // Si es un string JSON, intentar parsearlo
    if (typeof choices === 'string') {
      try {
        choices = JSON.parse(choices);
      } catch (e) {
        // No es un JSON válido, dejarlo como string
      }
    }

    if (Array.isArray(choices)) {
      if (choices.length === 0) return <span className="text-muted-foreground">-</span>;
      
      // Si es de tipo checkbox
      if (optionType === 'checkbox') {
        return (
          <div className="flex items-center space-x-2">
            <Checkbox checked={true} disabled />
            <span>{choices[0] || 'Opción'}</span>
          </div>
        );
      }
      
      // Para dropdown mostramos un mini desplegable
      return (
        <div className="space-y-1">
          {choices.slice(0, 3).map((choice, index) => (
            <div key={index} className="flex items-center space-x-1 text-sm">
              <div className={`h-2 w-2 rounded-full ${index === 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>{choice}</span>
            </div>
          ))}
          {choices.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{choices.length - 3} más...
            </div>
          )}
        </div>
      );
    }
    
    // Para otros formatos, mostrar una representación del objeto
    return (
      <div className="text-xs text-muted-foreground border p-1 rounded bg-gray-50">
        {typeof choices === 'object' 
          ? JSON.stringify(choices).slice(0, 50) + (JSON.stringify(choices).length > 50 ? '...' : '')
          : String(choices)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Opciones de Servicios</h2>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleAddNew}
            disabled={services.length === 0}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Opción
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
      
      {services.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
          <div className="flex items-center">
            <AlertCircleIcon className="h-5 w-5 mr-2" />
            <span>Debes crear servicios primero antes de agregar opciones.</span>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : options.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay opciones configuradas. Haz clic en "Agregar Opción" para crear una.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Nombre de la opción</TableHead>
                <TableHead>Opciones</TableHead>
                <TableHead className="w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map(option => {
                const service = services.find(s => s.id === option.service_id);
                return (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">
                      {service?.description || 'Servicio desconocido'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{option.option_name || ''}</span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {formatChoices(option.choices, option.option_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(option)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(option)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Diálogo de formulario para agregar/editar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {currentOption ? 'Editar Opción' : 'Agregar Nueva Opción'}
            </DialogTitle>
            <DialogDescription>
              {currentOption 
                ? 'Modifica la información de la opción de servicio.' 
                : 'Ingresa la información para crear una nueva opción de servicio.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="service_id">Servicio</Label>
                <Select 
                  value={formData.service_id} 
                  onValueChange={(value) => handleChange({ target: { name: 'service_id', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="option_name">Nombre de la opción</Label>
                <Input
                  id="option_name"
                  name="option_name"
                  value={formData.option_name}
                  onChange={handleChange}
                  placeholder="Ej. Tamaño de foto"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="option_type">Tipo de Opción</Label>
                <Select 
                  value={formData.option_type} 
                  onValueChange={(value) => handleChange({ target: { name: 'option_type', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dropdown">Desplegable</SelectItem>
                    <SelectItem value="checkbox">Casilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="choices">
                  {formData.option_type === 'dropdown' 
                    ? 'Opciones (una por línea)' 
                    : 'Texto de la casilla'}
                </Label>
                <Textarea
                  id="choices"
                  name="choices"
                  value={formData.choices}
                  onChange={handleChange}
                  placeholder={formData.option_type === 'dropdown' 
                    ? "Ingresa cada opción en una línea diferente\nEjemplo:\n4x6cm\n5x7cm\n6x8cm"
                    : "Ingresa el texto que se mostrará junto a la casilla"}
                  className="min-h-[100px] font-mono"
                />
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
              Esta acción eliminará la opción "{currentOption?.option_name}" y no se puede deshacer.
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

export default OpcionesTab; 