import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

type Group = Database['public']['Tables']['groups']['Row'];

interface NuevoGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const groupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  institution: z.string().min(1, 'La institución es requerida'),
  delivery_date: z.string().min(1, 'La fecha de entrega es requerida'),
  comments: z.string().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

export default function NuevoGrupoDialog({
  open,
  onOpenChange,
  onSuccess
}: NuevoGrupoDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema)
  });

  const onSubmit = async (data: GroupFormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('groups')
        .insert({
          ...data,
          status: 'pendiente' as Group['status']
        });

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "El grupo ha sido creado correctamente",
      });

      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Grupo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Grupo
            </label>
            <Input
              {...register('name')}
              placeholder="Ej: Grupo A"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institución
            </label>
            <Input
              {...register('institution')}
              placeholder="Ej: Escuela Primaria"
            />
            {errors.institution && (
              <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Entrega
            </label>
            <Input
              type="date"
              {...register('delivery_date')}
            />
            {errors.delivery_date && (
              <p className="mt-1 text-sm text-red-600">{errors.delivery_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios (opcional)
            </label>
            <textarea
              {...register('comments')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              placeholder="Agrega cualquier nota o comentario relevante..."
            />
          </div>

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
              {submitting ? 'Creando grupo...' : 'Crear Grupo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 