import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type GroupMember } from './DetallesGrupoDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Loader2, 
  Printer, 
  ArrowRight, 
  Image,
  BanknoteIcon,
} from 'lucide-react';
import { Label } from "@/components/ui/label";

interface PhotoPackage {
  id: string;
  name: string;
  description: string;
  base_price: number;
  options: {
    id: string;
    name: string;
    price_increment: number;
  }[];
}

interface NuevaOrdenGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: GroupMember | null;
  groupId: string;
  onSuccess: () => void;
}

const orderSchema = z.object({
  package_id: z.string().min(1, 'Debe seleccionar un paquete'),
  selected_options: z.array(z.string()),
  delivery_format: z.enum(['impresa', 'digital', 'ambos'], {
    required_error: "Selecciona un formato de entrega"
  }).default('impresa'),
  total_price: z.number().min(0, 'El precio total no puede ser negativo'),
  advance_payment: z.number().min(0, 'El anticipo no puede ser negativo'),
  remaining_payment: z.number().min(0, 'El pago restante no puede ser negativo'),
  comments: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const NuevaOrdenGrupoDialog: React.FC<NuevaOrdenGrupoDialogProps> = ({
  open,
  onOpenChange,
  member,
  groupId,
  onSuccess
}) => {
  const [packages, setPackages] = useState<PhotoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PhotoPackage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [ticketContent, setTicketContent] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      selected_options: [],
      delivery_format: 'impresa',
      total_price: 0,
      advance_payment: 0,
      remaining_payment: 0,
      comments: '',
    }
  });

  useEffect(() => {
    if (open) {
      fetchPackages();
    } else {
      reset();
      setSelectedPackage(null);
      setShowPreview(false);
      setCreatedOrder(null);
    }
  }, [open]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_packages')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      setPackages(data || []);
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes fotográficos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const watchPackageId = watch('package_id');
  const watchSelectedOptions = watch('selected_options');
  const watchAdvancePayment = watch('advance_payment');
  const watchTotalPrice = watch('total_price');

  useEffect(() => {
    if (watchPackageId) {
      const pkg = packages.find(p => p.id === watchPackageId);
      setSelectedPackage(pkg || null);
      
      if (pkg) {
        const basePrice = pkg.base_price;
        setValue('total_price', basePrice);
        setValue('advance_payment', Math.ceil(basePrice * 0.3)); // 30% por defecto
        setValue('remaining_payment', basePrice - Math.ceil(basePrice * 0.3));
      }
    }
  }, [watchPackageId, packages]);

  // Recalcular el precio total cuando cambien las opciones
  useEffect(() => {
    if (selectedPackage) {
      let totalPrice = selectedPackage.base_price;
      
      if (watchSelectedOptions && selectedPackage.options) {
        selectedPackage.options.forEach(option => {
          if (watchSelectedOptions.includes(option.id)) {
            totalPrice += option.price_increment;
          }
        });
      }
      
      setValue('total_price', totalPrice);
      
      // Si no han modificado manualmente el anticipo, actualizar al 30%
      if (!manuallyChangedAdvance) {
        const defaultAdvance = Math.ceil(totalPrice * 0.3);
        setValue('advance_payment', defaultAdvance);
        setValue('remaining_payment', totalPrice - defaultAdvance);
      } else {
        // Solo actualizar el remaining_payment
        setValue('remaining_payment', totalPrice - watchAdvancePayment);
      }
    }
  }, [watchSelectedOptions, selectedPackage]);

  // Variable para rastrear si el anticipo fue modificado manualmente
  const [manuallyChangedAdvance, setManuallyChangedAdvance] = useState(false);

  // Manejar cambios en el anticipo
  const handleAdvancePaymentChange = (value: string) => {
    setManuallyChangedAdvance(true);
    const advance = parseInt(value, 10) || 0;
    setValue('advance_payment', advance);
    setValue('remaining_payment', watchTotalPrice - advance);
  };

  const calculateTotal = () => {
    if (!selectedPackage) return 0;

    let total = selectedPackage.base_price;

    if (watchSelectedOptions && selectedPackage.options) {
      selectedPackage.options.forEach(option => {
        if (watchSelectedOptions.includes(option.id)) {
          total += option.price_increment;
        }
      });
    }

    return total;
  };

  // Función para generar el contenido del ticket
  const generateTicketContent = (orden: any) => {
    if (!selectedPackage || !member?.customer) return '';
    
    const options = watchSelectedOptions.map(optionId => {
      const option = selectedPackage.options.find(opt => opt.id === optionId);
      return option ? `+ ${option.name} (+${formatPrice(option.price_increment)})` : '';
    }).filter(Boolean).join('\n');

    const content = `
FOTO RÉFLEX
Orden de Servicio - Grupo: ${groupId}

Folio: ${orden.folio}
Fecha: ${new Date().toLocaleDateString()}
Cliente: ${member.customer.name}
Teléfono: ${member.customer.phone}

PAQUETE:
${selectedPackage.name} - ${formatPrice(selectedPackage.base_price)}
${options}

Total: ${formatPrice(watchTotalPrice)}
Anticipo: ${formatPrice(watchAdvancePayment)}
Restante: ${formatPrice(watchTotalPrice - watchAdvancePayment)}

Formato de entrega: ${orden.delivery_format}
${orden.comments ? `Comentarios: ${orden.comments}` : ''}

¡Gracias por su preferencia!
    `;
    return content.trim();
  };

  // Función para imprimir ticket
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && createdOrder) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - ${createdOrder.folio}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              font-family: monospace;
              width: 58mm;
              padding: 3mm;
              margin: 0;
              font-size: 10px;
              line-height: 1.2;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mb-1 { margin-bottom: 3mm; }
            hr { border: 1px dashed #000; }
          </style>
        </head>
        <body>
          <pre>${ticketContent}</pre>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Función para compartir por WhatsApp
  const handleShareWhatsApp = () => {
    if (!member?.customer || !ticketContent) return;
    
    const phoneNumber = member.customer.phone.replace(/\D/g, '');
    const formattedPhone = phoneNumber.startsWith('52') ? phoneNumber : `52${phoneNumber}`;
    
    const text = encodeURIComponent(ticketContent);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!member || !selectedPackage) return;

    setSubmitting(true);
    try {
      // Generar folio único
      const folio = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const orderData = {
        customer_id: member.customer.id,
        group_id: groupId,
        package_id: data.package_id,
        selected_options: data.selected_options,
        total_price: data.total_price,
        advance_payment: data.advance_payment,
        delivery_format: data.delivery_format,
        status: 'pendiente',
        priority: 'normal',
        comments: data.comments || null,
        files_path: null,
        folio: folio,
        created_at: new Date().toISOString()
      };

      console.log("Enviando datos de orden:", orderData);
      
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error("Error de Supabase al crear orden:", error);
        throw error;
      }

      toast({
        title: "¡Éxito!",
        description: "La orden ha sido creada correctamente",
      });

      // Guardar la orden creada para la vista previa
      setCreatedOrder(newOrder);
      setTicketContent(generateTicketContent({
        ...newOrder,
        delivery_format: data.delivery_format
      }));
      setShowPreview(true);
      
      onSuccess();
    } catch (error) {
      console.error('Error al crear orden:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden",
        variant: "destructive"
      });
      setSubmitting(false);
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

  return (
    <Dialog open={open} onOpenChange={(value) => {
      // Solo cerrar si no está guardando
      if (!submitting) {
        onOpenChange(value);
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showPreview 
              ? `Vista previa de orden para ${member?.customer.name}`
              : `Nueva Orden para ${member?.customer.name}`}
          </DialogTitle>
          <DialogDescription>
            {showPreview 
              ? "Revisa los detalles de la orden creada" 
              : "Completa el formulario para crear una nueva orden"}
          </DialogDescription>
        </DialogHeader>

        {showPreview ? (
          // Vista previa de la orden creada
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Detalles de la Orden</h3>
                  <p className="text-sm text-gray-500">Folio: {createdOrder?.folio}</p>
                  <p className="text-sm text-gray-500">Creada: {new Date(createdOrder?.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Cliente:</span>
                  <p>{member?.customer.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                  <p>{member?.customer.phone}</p>
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-2">Paquete seleccionado</h4>
                <p className="text-sm">{selectedPackage?.name} - {formatPrice(selectedPackage?.base_price || 0)}</p>
                
                {watchSelectedOptions.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Opciones adicionales:</h5>
                    <ul className="text-sm">
                      {watchSelectedOptions.map(optionId => {
                        const option = selectedPackage?.options.find(opt => opt.id === optionId);
                        return option ? (
                          <li key={option.id} className="ml-4 list-disc">
                            {option.name} (+{formatPrice(option.price_increment)})
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Formato de entrega:</span>
                <p className="capitalize">{createdOrder?.delivery_format}</p>
              </div>
              
              {createdOrder?.comments && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Comentarios:</span>
                  <p className="text-sm text-gray-700">{createdOrder.comments}</p>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total:</span>
                    <p className="font-bold">{formatPrice(createdOrder?.total_price || 0)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Anticipo:</span>
                    <p className="font-medium">{formatPrice(createdOrder?.advance_payment || 0)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Restante:</span>
                    <p className="font-medium">{formatPrice(createdOrder?.remaining_payment || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="mr-auto"
                >
                  Cerrar
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    className="flex items-center gap-1"
                  >
                    <Printer size={16} />
                    <span>Imprimir</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-1"
                  >
                    <span>WhatsApp</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        ) : (
          // Formulario para crear orden
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{member?.customer.name}</h3>
                  <p className="text-sm text-gray-500">{member?.customer.phone}</p>
                  {member?.customer.email && <p className="text-sm text-gray-500">{member?.customer.email}</p>}
                </div>
              </div>
            </div>
            
            {/* Selección de paquete */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="package_id">Paquete Fotográfico</Label>
                <Select
                  onValueChange={(value) => setValue('package_id', value)}
                  defaultValue={watch('package_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paquete..." />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {formatPrice(pkg.base_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.package_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.package_id.message}</p>
                )}
              </div>
            </div>
            
            {/* Opciones del paquete */}
            {selectedPackage && selectedPackage.options && selectedPackage.options.length > 0 && (
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium mb-3">Opciones Adicionales</h3>
                <div className="space-y-2">
                  {selectedPackage.options.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <Checkbox
                        id={option.id}
                        value={option.id}
                        onCheckedChange={(checked) => {
                          const current = watch('selected_options') || [];
                          if (checked) {
                            setValue('selected_options', [...current, option.id]);
                          } else {
                            setValue('selected_options', current.filter(id => id !== option.id));
                          }
                        }}
                        checked={watch('selected_options')?.includes(option.id)}
                        className="mr-2"
                      />
                      <label htmlFor={option.id} className="text-sm">
                        {option.name} (+{formatPrice(option.price_increment)})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Configuración de la orden */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_format" className="flex items-center gap-1">
                  <Image size={14} />
                  Formato de entrega
                </Label>
                <Select
                  onValueChange={(value) => setValue('delivery_format', value as any)}
                  defaultValue={watch('delivery_format')}
                >
                  <SelectTrigger id="delivery_format">
                    <SelectValue placeholder="Seleccionar formato..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impresa">Impresa</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
                {errors.delivery_format && (
                  <p className="text-sm text-red-500">{errors.delivery_format.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comments">Comentarios (opcional)</Label>
                <Input
                  id="comments"
                  placeholder="Comentarios adicionales..."
                  {...register('comments')}
                />
                {errors.comments && (
                  <p className="text-sm text-red-500">{errors.comments.message}</p>
                )}
              </div>
            </div>

            {/* Sección de pagos */}
            {selectedPackage && (
              <div className="space-y-4">
                <Separator />
                <h3 className="font-medium flex items-center gap-1">
                  <BanknoteIcon size={16} />
                  Información de pago
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_price">Total</Label>
                    <Input
                      id="total_price"
                      type="number"
                      step="1"
                      readOnly
                      value={watch('total_price')}
                    />
                    {errors.total_price && (
                      <p className="text-sm text-red-500">{errors.total_price.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="advance_payment">Anticipo</Label>
                    <Input
                      id="advance_payment"
                      type="number"
                      step="1"
                      value={watch('advance_payment')}
                      onChange={(e) => handleAdvancePaymentChange(e.target.value)}
                      className="bg-white"
                    />
                    {errors.advance_payment && (
                      <p className="text-sm text-red-500">{errors.advance_payment.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="remaining_payment">Restante</Label>
                    <Input
                      id="remaining_payment"
                      type="number"
                      step="1"
                      readOnly
                      value={watch('remaining_payment')}
                    />
                    {errors.remaining_payment && (
                      <p className="text-sm text-red-500">{errors.remaining_payment.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="mr-auto"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={submitting || !selectedPackage}
                className="flex items-center gap-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creando orden...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Crear Orden</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NuevaOrdenGrupoDialog; 