import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { PhotoPackage } from '@/types/supabase';

interface EditarPaqueteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: PhotoPackage | null;
  onSuccess: () => void;
}

const packageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  base_price: z.string().min(1, 'El precio base es requerido').transform(val => parseFloat(val)),
  active: z.boolean(),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageOption {
  id: string;
  name: string;
  price_increment: string;
}

const EditarPaqueteDialog: React.FC<EditarPaqueteDialogProps> = ({
  open,
  onOpenChange,
  package: pkg,
  onSuccess
}) => {
  const [options, setOptions] = useState<PackageOption[]>([]);
  const [currentOption, setCurrentOption] = useState<PackageOption>({
    id: '',
    name: '',
    price_increment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema)
  });

  useEffect(() => {
    if (pkg) {
      setValue('name', pkg.name);
      setValue('description', pkg.description);
      setValue('base_price', pkg.base_price.toString());
      setValue('active', pkg.active);
      setOptions(pkg.options.map(opt => ({
        id: opt.id,
        name: opt.name,
        price_increment: opt.price_increment.toString()
      })));
    }
  }, [pkg]);

  const handleAddOption = () => {
    if (!currentOption.name || !currentOption.price_increment) {
      toast({
        title: "Error",
        description: "El nombre y precio de la opción son requeridos",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(currentOption.price_increment);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "El precio debe ser un número válido mayor o igual a 0",
        variant: "destructive"
      });
      return;
    }

    setOptions([...options, { ...currentOption, id: uuidv4() }]);
    setCurrentOption({ id: '', name: '', price_increment: '' });
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const onSubmit = async (data: PackageFormData) => {
    if (!pkg) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('photo_packages')
        .update({
          name: data.name,
          description: data.description,
          base_price: data.base_price,
          options: options.map(opt => ({
            id: opt.id,
            name: opt.name,
            price_increment: parseFloat(opt.price_increment)
          })),
          active: data.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', pkg.id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "El paquete ha sido actualizado correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al actualizar paquete:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Paquete Fotográfico</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Paquete
              </label>
              <Input
                {...register('name')}
                placeholder="Ej: Paquete Básico"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Describe el contenido del paquete..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Base
              </label>
              <Input
                {...register('base_price')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              {errors.base_price && (
                <p className="mt-1 text-sm text-red-600">{errors.base_price.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('active')}
                className="rounded border-gray-300 text-blue-600"
              />
              <label className="text-sm font-medium text-gray-700">
                Paquete activo
              </label>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Opciones Adicionales</h3>

            {/* Lista de opciones */}
            <div className="space-y-2">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <p className="text-sm text-gray-500">+${option.price_increment}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(option.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Formulario para agregar opción */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">Agregar Opción</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre de la opción"
                  value={currentOption.name}
                  onChange={(e) => setCurrentOption({ ...currentOption, name: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio adicional"
                  value={currentOption.price_increment}
                  onChange={(e) => setCurrentOption({ ...currentOption, price_increment: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Agregar Opción
              </Button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Guardando cambios...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditarPaqueteDialog; 