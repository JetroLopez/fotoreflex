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
import { useToast } from "@/hooks/use-toast";

type PhotoPackage = Database['public']['Tables']['photo_packages']['Row'];

interface DetallesPaqueteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageData: PhotoPackage | null;
}

export default function DetallesPaqueteDialog({
  open,
  onOpenChange,
  packageData
}: DetallesPaqueteDialogProps) {
  const { toast } = useToast();

  if (!packageData) return null;

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles del Paquete</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del paquete */}
          <div>
            <h3 className="text-lg font-medium">{packageData.name}</h3>
            <p className="mt-1 text-gray-500">{packageData.description}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Precio Base:</span>
              <span className="font-bold">{formatPrice(packageData.base_price)}</span>
            </div>
          </div>

          {/* Opciones del paquete */}
          {packageData.options && packageData.options.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Opciones disponibles</h4>
              <div className="space-y-2">
                {packageData.options.map((option: any) => (
                  <div key={option.id} className="flex justify-between items-center border-b pb-2">
                    <span>{option.name}</span>
                    <span className="text-gray-600">{formatPrice(option.price_increment)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Estado:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              packageData.active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {packageData.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 