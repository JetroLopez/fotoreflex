import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Search, 
  Phone, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Printer,
  Check,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Esquema para la búsqueda de cliente
const clienteSearchSchema = z.object({
  phone: z.string().min(1, "El teléfono es requerido para buscar"),
});

// Esquema para nuevo cliente
const nuevoClienteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  email: z.string().email("Ingresa un email válido").or(z.string().length(0)).optional(),
  address: z.string().optional()
});

// Esquema para la selección del servicio
const servicioSchema = z.object({
  service_id: z.string().min(1, "Selecciona un servicio")
});

// Esquema para las opciones de servicio
const opcionesServicioSchema = z.record(z.string(), z.union([z.string(), z.boolean(), z.number()]));

// Esquema para la orden
const ordenSchema = z.object({
  delivery_format: z.enum(['impresa', 'digital', 'ambos'], {
    required_error: "Selecciona un formato de entrega"
  }),
  total_price: z.coerce.number().min(1, "El precio total debe ser mayor a 0"),
  advance_payment: z.coerce.number().min(1, "El anticipo es requerido y debe ser mayor a 0"),
  comments: z.string().optional(),
  priority: z.enum(['normal', 'urgente'], {
    required_error: "Selecciona la prioridad de la orden"
  }).default('normal')
});

// Tipos para formularios
type ClienteSearchValues = z.infer<typeof clienteSearchSchema>;
type NuevoClienteValues = z.infer<typeof nuevoClienteSchema>;
type ServicioValues = z.infer<typeof servicioSchema>;
type OpcionesServicioValues = z.infer<typeof opcionesServicioSchema>;
type OrdenValues = z.infer<typeof ordenSchema>;

// Tipo para las opciones de servicio desde la BD
interface ServiceOption {
  id: string;
  service_id: string;
  option_name: string;
  option_type: string;
  choices: Record<string, number>;
  required: boolean;
}

// Tipo para un servicio seleccionado con sus opciones
interface SelectedServiceItem {
  service: PhotoService;
  opciones: ServiceOption[];
  opcionesValues: OpcionesServicioValues;
  quantity: number;
  subtotal: number;
}

// Tipo para un servicio
type PhotoService = {
  id: string;
  description: string;
  type: string;
  base_price: number;
  active: boolean;
};

interface NuevaOrdenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: () => void;
}

const NuevaOrdenDialog: React.FC<NuevaOrdenDialogProps> = ({ open, onOpenChange, onOrderCreated }) => {
  const [step, setStep] = useState<'buscar_cliente' | 'nuevo_cliente' | 'seleccionar_servicio' | 'opciones_servicio' | 'detalles_orden'>('buscar_cliente');
  const [isClienteNuevo, setIsClienteNuevo] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [servicios, setServicios] = useState<PhotoService[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<PhotoService | null>(null);
  const [opcionesServicio, setOpcionesServicio] = useState<ServiceOption[]>([]);
  const [calculandoPrecio, setCalculandoPrecio] = useState(false);
  const [precioBase, setPrecioBase] = useState(0);
  const [precioTotal, setPrecioTotal] = useState(0);
  const [precioAdicionales, setPrecioAdicionales] = useState(0);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<SelectedServiceItem[]>([]);
  const [creandoOrden, setCreandoOrden] = useState(false);
  const [priority, setPriority] = useState<'normal' | 'urgente'>('normal');
  const [urgentFee, setUrgentFee] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentFolio, setCurrentFolio] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [ticketContent, setTicketContent] = useState('');

  // Formulario para búsqueda de cliente
  const searchForm = useForm<ClienteSearchValues>({
    resolver: zodResolver(clienteSearchSchema),
    defaultValues: {
      phone: ''
    }
  });

  // Formulario para nuevo cliente
  const nuevoClienteForm = useForm<NuevoClienteValues>({
    resolver: zodResolver(nuevoClienteSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: ''
    }
  });

  // Formulario para selección de servicio
  const servicioForm = useForm<ServicioValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      service_id: ''
    },
    mode: 'onChange'
  });

  // Formulario para opciones de servicio
  const opcionesServicioForm = useForm<OpcionesServicioValues>({
    resolver: zodResolver(opcionesServicioSchema),
    defaultValues: {}
  });

  // Formulario para orden
  const ordenForm = useForm<OrdenValues>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      delivery_format: 'impresa',
      total_price: 0,
      advance_payment: 0,
      comments: '',
      priority: 'normal'
    }
  });

  // Cargar servicios al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchServicios();
    }
  }, [open]);

  const fetchServicios = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_services')
        .select('*')
        .eq('active', true)
        .order('description');

      if (error) throw error;

      setServicios(data || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive"
      });
    }
  };

  // Si el diálogo se cierra, resetear todo
  useEffect(() => {
    if (!open) {
      setStep('buscar_cliente');
      setIsClienteNuevo(false);
      setClienteEncontrado(null);
      setServicioSeleccionado(null);
      setOpcionesServicio([]);
      setPrecioBase(0);
      setPrecioTotal(0);
      setPrecioAdicionales(0);
      setServiciosSeleccionados([]);
      searchForm.reset();
      nuevoClienteForm.reset();
      servicioForm.reset();
      opcionesServicioForm.reset();
      ordenForm.reset();
    }
  }, [open, searchForm, nuevoClienteForm, servicioForm, opcionesServicioForm, ordenForm]);

  // Manejar cambios en opciones de servicio para recalcular precio
  useEffect(() => {
    if (servicioSeleccionado) {
      calcularPrecio();
    }
  }, [opcionesServicioForm.watch()]);

  // Calcular precio total de todos los servicios seleccionados
  useEffect(() => {
    if (serviciosSeleccionados.length > 0) {
      const subtotal = serviciosSeleccionados.reduce((sum, item) => sum + item.subtotal, 0);
      const cargoUrgencia = calcularCargoUrgencia(subtotal);
      setUrgentFee(cargoUrgencia);
      const total = subtotal + cargoUrgencia;
      setPrecioTotal(total);
      ordenForm.setValue('total_price', total);
      
      // Calcular anticipo predeterminado (30%)
      const anticipoPredeterminado = Math.ceil(total * 0.3);
      ordenForm.setValue('advance_payment', anticipoPredeterminado);
    }
  }, [serviciosSeleccionados, priority]);

  // Agregar el useEffect para el anticipo
  useEffect(() => {
    const subscription = ordenForm.watch((value, { name }) => {
      if (name === 'advance_payment') {
        setAdvancePayment(Number(value.advance_payment) || 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [ordenForm]);

  // Buscar cliente por teléfono
  const handleBuscarCliente = async (values: ClienteSearchValues) => {
    setBuscandoCliente(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', values.phone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Cliente no encontrado",
            description: "No se encontró ningún cliente con ese número de teléfono",
            variant: "destructive"
          });
          // Pre-llenar el formulario de nuevo cliente con el teléfono
          nuevoClienteForm.setValue('phone', values.phone);
          setIsClienteNuevo(true);
          setStep('nuevo_cliente');
        } else {
          throw error;
        }
      } else if (data) {
        setClienteEncontrado(data);
        // Pre-llenar el formulario de nuevo cliente por si quieren editar
        nuevoClienteForm.setValue('name', data.name);
        nuevoClienteForm.setValue('phone', data.phone);
        nuevoClienteForm.setValue('email', data.email || '');
        nuevoClienteForm.setValue('address', data.address || '');
        // Pasar a selección de servicio
        setStep('seleccionar_servicio');
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar el cliente",
        variant: "destructive"
      });
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Registrar nuevo cliente
  const handleNuevoCliente = async (values: NuevoClienteValues) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: values.name.trim(),
          phone: values.phone,
          email: values.email || null,
          address: values.address || null
        })
        .select()
        .single();

      if (error) throw error;

      setClienteEncontrado(data);
      toast({
        title: "Cliente registrado",
        description: "El cliente se ha registrado correctamente"
      });
      setStep('seleccionar_servicio');
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el cliente",
        variant: "destructive"
      });
    }
  };

  // Seleccionar servicio
  const handleSeleccionarServicio = async (values: ServicioValues) => {
    try {
      if (!values.service_id) {
        toast({
          title: "Error",
          description: "Por favor selecciona un servicio",
          variant: "destructive"
        });
        return;
      }

      const servicio = servicios.find(s => s.id === values.service_id);
      if (!servicio) {
        toast({
          title: "Error",
          description: "Servicio no encontrado",
          variant: "destructive"
        });
        return;
      }

      setServicioSeleccionado(servicio);
      setPrecioBase(servicio.base_price);
      
      // Cargar opciones de servicio
      const { data: opciones, error } = await supabase
        .from('service_options')
        .select('*')
        .eq('service_id', values.service_id);

      if (error) {
        console.error('Error al cargar opciones:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las opciones del servicio",
          variant: "destructive"
        });
        return;
      }

      // Convert the Supabase JSON data to the expected format
      const processedOptions = opciones?.map(option => ({
        ...option,
        choices: typeof option.choices === 'object' ? option.choices as Record<string, number> : {}
      })) || [];
      
      setOpcionesServicio(processedOptions);
      
      // Inicializar formulario de opciones con valores predeterminados
      const defaultValues: Record<string, string | boolean> = {};
      processedOptions.forEach(opcion => {
        if (opcion.option_type === 'dropdown' && opcion.choices) {
          // Para dropdowns, seleccionar la primera opción
          const firstChoice = Object.keys(opcion.choices)[0];
          defaultValues[opcion.option_name] = firstChoice;
        } else if (opcion.option_type === 'checkbox') {
          // Para checkboxes, inicializar como false
          defaultValues[opcion.option_name] = false;
        }
      });

      opcionesServicioForm.reset(defaultValues);
      
      // Inicializar precio total
      calcularPrecio();
    } catch (error) {
      console.error('Error al seleccionar servicio:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al seleccionar el servicio",
        variant: "destructive"
      });
    }
  };

  // Calcular precio total basado en opciones seleccionadas
  const calcularPrecio = () => {
    if (!servicioSeleccionado) return;
    
    setCalculandoPrecio(true);
    try {
      let precioAdicionalesTemp = 0;
      const valores = opcionesServicioForm.getValues();
      
      opcionesServicio.forEach(opcion => {
        const valorSeleccionado = valores[opcion.option_name];
        
        if (opcion.option_type === 'dropdown' && typeof valorSeleccionado === 'string') {
          precioAdicionalesTemp += opcion.choices[valorSeleccionado] || 0;
        } else if (opcion.option_type === 'checkbox' && valorSeleccionado === true) {
          precioAdicionalesTemp += opcion.choices['true'] || 0;
        }
      });
      
      setPrecioAdicionales(precioAdicionalesTemp);
      
      // Calcular precio total considerando cantidad
      const cantidad = 1; // Cantidad fija para el servicio actual
      const precioTotalCalculado = (precioBase + precioAdicionalesTemp) * cantidad;
      setPrecioTotal(precioTotalCalculado);
      ordenForm.setValue('total_price', precioTotalCalculado);
      
      // Calcular anticipo predeterminado (30%)
      const anticipoPredeterminado = Math.ceil(precioTotalCalculado * 0.3);
      ordenForm.setValue('advance_payment', anticipoPredeterminado);
    } catch (error) {
      console.error('Error al calcular precio:', error);
    } finally {
      setCalculandoPrecio(false);
    }
  };

  // Agregar servicio actual a la lista de servicios seleccionados
  const handleAgregarServicio = () => {
    if (!servicioSeleccionado) return;
    
    // Obtener valores actuales
    const opcionesValues = opcionesServicioForm.getValues();
    
    // Calcular subtotal
    let precioAdicionalesTemp = 0;
    
    opcionesServicio.forEach(opcion => {
      const valorSeleccionado = opcionesValues[opcion.option_name];
      
      if (opcion.option_type === 'dropdown' && typeof valorSeleccionado === 'string') {
        precioAdicionalesTemp += opcion.choices[valorSeleccionado] || 0;
      } else if (opcion.option_type === 'checkbox' && valorSeleccionado === true) {
        precioAdicionalesTemp += opcion.choices['true'] || 0;
      }
    });
    
    const subtotal = servicioSeleccionado.base_price + precioAdicionalesTemp;
    
    // Agregar a la lista de servicios seleccionados
    const nuevoServicio: SelectedServiceItem = {
      service: servicioSeleccionado,
      opciones: [...opcionesServicio],
      opcionesValues: {...opcionesValues},
      quantity: 1,
      subtotal: subtotal
    };
    
    setServiciosSeleccionados([...serviciosSeleccionados, nuevoServicio]);
    
    // Resetear formularios para seleccionar otro servicio
    servicioForm.reset();
    opcionesServicioForm.reset();
    ordenForm.setValue('advance_payment', Math.ceil(subtotal * 0.3));
    setServicioSeleccionado(null);
    setOpcionesServicio([]);
    
    toast({
      title: "Servicio agregado",
      description: `Se agregó ${servicioSeleccionado.description} a la orden`
    });
  };

  // Eliminar un servicio de la lista
  const handleEliminarServicio = (index: number) => {
    const nuevosServicios = [...serviciosSeleccionados];
    nuevosServicios.splice(index, 1);
    setServiciosSeleccionados(nuevosServicios);
  };

  // Continuar a detalles de orden después de seleccionar al menos un servicio
  const handleContinuarADetalles = () => {
    if (serviciosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un servicio a la orden",
        variant: "destructive"
      });
      return;
    }
    
    setStep('detalles_orden');
  };

  // Continuar a detalles de orden o agregar servicio
  const handleOpcionesServicio = (agregarMas: boolean = false) => {
    if (agregarMas) {
      handleAgregarServicio();
    } else {
      handleAgregarServicio();
      handleContinuarADetalles();
    }
  };

  // Función para generar el contenido del ticket
  const generateTicketContent = (orden: any) => {
    const content = `
FOTO RÉFLEX
Orden de Servicio

Folio: ${orden.folio}
Fecha: ${new Date().toLocaleDateString()}
Cliente: ${clienteEncontrado.name}
Teléfono: ${clienteEncontrado.phone}

SERVICIOS:
${serviciosSeleccionados.map(item => `
${item.service.description}
${Object.entries(item.opcionesValues)
  .map(([key, value]) => {
    if (typeof value === 'boolean' && value) return `+ ${key}`;
    if (typeof value === 'string') return `+ ${key}: ${value}`;
    return '';
  })
  .filter(Boolean)
  .join('\n')}
Subtotal: ${formatPrice(item.subtotal)}
`).join('\n')}

${priority === 'urgente' ? `Cargo por urgencia (15%): ${formatPrice(urgentFee)}\n` : ''}
Total: ${formatPrice(precioTotal)}
Anticipo: ${formatPrice(advancePayment)}
Restante: ${formatPrice(precioTotal - advancePayment)}

Formato de entrega: ${ordenForm.getValues().delivery_format}
Prioridad: ${priority}
${ordenForm.getValues().comments ? `Comentarios: ${ordenForm.getValues().comments}` : ''}

¡Gracias por su preferencia!
    `;
    return content.trim();
  };

  // Función para imprimir ticket
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - ${currentFolio}</title>
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
    // Extraer el número de teléfono del ticket
    const phoneMatch = ticketContent.match(/Teléfono: (.*)/);
    if (!phoneMatch) {
      toast({
        title: "Error",
        description: "No se encontró el número de teléfono en el ticket",
        variant: "destructive"
      });
      return;
    }

    const phoneNumber = phoneMatch[1].replace(/\D/g, '');
    const formattedPhone = phoneNumber.startsWith('52') ? phoneNumber : `52${phoneNumber}`;
    
    const text = encodeURIComponent(ticketContent);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Modificar la función handleCrearOrden
  const handleCrearOrden = async (values: OrdenValues) => {
    if (isCreatingOrder) return; // Prevenir múltiples clicks
    
    if (!clienteEncontrado || serviciosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Información incompleta para crear la orden",
        variant: "destructive"
      });
      return;
    }

    if (values.advance_payment > values.total_price) {
      toast({
        title: "Error",
        description: "El anticipo no puede ser mayor que el total",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingOrder(true);
    try {
      const folio = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const orderData: {
        customer_id: string;
        delivery_format: 'impresa' | 'digital' | 'ambos';
        total_price: number;
        advance_payment: number;
        comments: string;
        folio: string;
        status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado';
        priority: 'normal' | 'urgente';
        created_at: string;
      } = {
        customer_id: clienteEncontrado.id,
        delivery_format: values.delivery_format,
        total_price: values.total_price,
        advance_payment: values.advance_payment || 0,
        comments: values.comments || '',
        folio: folio,
        status: 'pendiente' as const,
        priority: values.priority,
        created_at: new Date().toISOString()
      };

      const { data: orden, error: ordenError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (ordenError) throw new Error(ordenError.message);
      if (!orden) throw new Error('No se pudo crear la orden');

      for (const item of serviciosSeleccionados) {
        const orderItemData = {
          order_id: orden.id,
          service_id: item.service.id,
          quantity: item.quantity,
          unit_price: item.service.base_price,
          selected_options: item.opcionesValues,
          created_at: new Date().toISOString()
        };

        const { error: itemError } = await supabase
          .from('order_items')
          .insert(orderItemData);

        if (itemError) throw new Error(itemError.message);
      }

      // Guardar el cliente actual antes de resetear
      const clienteActual = { ...clienteEncontrado };
      
      // Generar el contenido del ticket
      const ticketContent = generateTicketContent(orden);
      
      // Actualizar estados
      setTicketContent(ticketContent);
      setCurrentFolio(folio);
      setShowConfirmation(true);
      
      // Notificar que se creó la orden
      onOrderCreated?.();

      // Cerrar la ventana principal
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear orden:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al crear la orden",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsCreatingOrder(false);
      }, 1000);
    }
  };

  // Renderizar formulario de opciones de servicio dinámicamente
  const renderOpcionesServicio = () => {
    if (!opcionesServicio.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No hay opciones configuradas para este servicio
        </div>
      );
    }

    return opcionesServicio.map((opcion) => {
      if (opcion.option_type === 'dropdown') {
        return (
          <FormField
            key={opcion.id}
            control={opcionesServicioForm.control}
            name={opcion.option_name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {opcion.option_name}
                  {opcion.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Select
                  value={field.value as string}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccionar ${opcion.option_name}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(opcion.choices || {}).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {key} {value > 0 && ` (+$${value})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (opcion.option_type === 'checkbox') {
        return (
          <FormField
            key={opcion.id}
            control={opcionesServicioForm.control}
            name={opcion.option_name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {opcion.option_name}
                    {opcion.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {opcion.choices?.true > 0 && `Costo adicional: +$${opcion.choices.true}`}
                  </p>
                </div>
              </FormItem>
            )}
          />
        );
      }
      return null;
    });
  };

  // Formatear número como precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  // Renderizar servicios seleccionados
  const renderServiciosSeleccionados = () => {
    if (serviciosSeleccionados.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No hay servicios seleccionados
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {serviciosSeleccionados.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
            <div>
              <p className="font-medium">{item.service.description} x {item.quantity}</p>
              <p className="text-sm text-gray-600">
                {Object.entries(item.opcionesValues).map(([key, value]) => {
                  if (typeof value === 'boolean' && value) {
                    return <span key={key} className="inline-block mr-2">{key}</span>;
                  } else if (typeof value === 'string') {
                    return <span key={key} className="inline-block mr-2">{key}: {value}</span>;
                  }
                  return null;
                })}
              </p>
              <p className="text-sm font-medium">{formatPrice(item.subtotal)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEliminarServicio(index)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // Agregar la función para calcular el cargo por urgencia
  const calcularCargoUrgencia = (total: number) => {
    if (priority === 'urgente') {
      return total * 0.15; // 15% de cargo por urgencia
    }
    return 0;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="fixed left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 sm:max-w-[600px] max-h-[90vh] overflow-y-auto" 
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {step === 'buscar_cliente' && "Buscar Cliente"}
              {step === 'nuevo_cliente' && "Registrar Nuevo Cliente"}
              {step === 'seleccionar_servicio' && "Seleccionar Servicio"}
              {step === 'opciones_servicio' && "Configurar Servicio"}
              {step === 'detalles_orden' && "Detalles de la Orden"}
            </DialogTitle>
          </DialogHeader>

          <div id="dialog-description" className="sr-only">
            {step === 'buscar_cliente' && "Formulario para buscar un cliente existente"}
            {step === 'nuevo_cliente' && "Formulario para registrar un nuevo cliente"}
            {step === 'seleccionar_servicio' && "Formulario para seleccionar un servicio"}
            {step === 'opciones_servicio' && "Formulario para configurar las opciones del servicio"}
            {step === 'detalles_orden' && "Formulario para completar los detalles de la orden"}
          </div>

          {/* Step 1: Buscar Cliente */}
          {step === 'buscar_cliente' && (
            <div className="space-y-6">
              <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(handleBuscarCliente)} className="space-y-4">
                  <FormField
                    control={searchForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Teléfono</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input 
                              placeholder="Ej. 442-123-4567" 
                              {...field} 
                              className="flex-1"
                            />
                          </FormControl>
                          <Button type="submit" disabled={buscandoCliente}>
                            {buscandoCliente ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cliente-nuevo" 
                  checked={isClienteNuevo}
                  onCheckedChange={(checked) => {
                    setIsClienteNuevo(!!checked);
                    if (checked) {
                      setStep('nuevo_cliente');
                    }
                  }}
                />
                <label
                  htmlFor="cliente-nuevo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cliente Nuevo
                </label>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Nuevo Cliente */}
          {step === 'nuevo_cliente' && (
            <div className="space-y-6">
              <Form {...nuevoClienteForm}>
                <form onSubmit={nuevoClienteForm.handleSubmit(handleNuevoCliente)} className="space-y-4">
                  <FormField
                    control={nuevoClienteForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={nuevoClienteForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. 442-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={nuevoClienteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={nuevoClienteForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección del cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setStep('buscar_cliente');
                        setIsClienteNuevo(false);
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                    <Button type="submit">
                      Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 3: Seleccionar Servicio */}
          {step === 'seleccionar_servicio' && clienteEncontrado && (
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Cliente</h3>
                <p className="text-sm text-gray-600">{clienteEncontrado.name}</p>
                <p className="text-sm text-gray-600">{clienteEncontrado.phone}</p>
                {clienteEncontrado.email && <p className="text-sm text-gray-600">{clienteEncontrado.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel izquierdo: Lista de servicios seleccionados */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Servicios en la Orden</h3>
                  {renderServiciosSeleccionados()}
                  {serviciosSeleccionados.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="font-medium text-lg">{formatPrice(precioTotal)}</span>
                      </div>
                      <Button 
                        onClick={handleContinuarADetalles}
                        className="w-full mt-4"
                      >
                        Continuar a Detalles <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Panel derecho: Formulario para agregar servicio */}
                <div className="space-y-4 border-l pl-6">
                  <h3 className="font-medium text-gray-700">Agregar Servicio</h3>
                  <Form {...servicioForm}>
                    <form className="space-y-4">
                      <FormField
                        control={servicioForm.control}
                        name="service_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Servicio</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleSeleccionarServicio({ service_id: value });
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar servicio" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {servicios.map((servicio) => (
                                  <SelectItem key={servicio.id} value={servicio.id}>
                                    <div className="flex justify-between items-center w-full">
                                      <span>{servicio.description}</span>
                                      <span className="text-sm text-muted-foreground ml-4">
                                        {formatPrice(servicio.base_price)}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {servicioSeleccionado && (
                        <div className="space-y-4 border-t pt-4">
                          {renderOpcionesServicio()}

                          <div className="pt-4 border-t">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-600">Precio base:</span>
                              <span>{formatPrice(precioBase)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-600">Adicionales:</span>
                              <span>{formatPrice(precioAdicionales)}</span>
                            </div>
                            <div className="flex justify-between items-center font-medium">
                              <span>Total:</span>
                              <span>{formatPrice(precioTotal)}</span>
                            </div>
                          </div>

                          <Button 
                            type="button"
                            onClick={handleAgregarServicio}
                            className="w-full"
                          >
                            Agregar a la Orden <Plus className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Opciones de Servicio */}
          {step === 'opciones_servicio' && servicioSeleccionado && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Servicio</h3>
                <p className="text-sm text-gray-600">{servicioSeleccionado.description}</p>
              </div>

              {renderOpcionesServicio()}

              <div className="flex justify-between pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('seleccionar_servicio');
                    setServicioSeleccionado(null);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <div className="space-x-2">
                  <Button 
                    onClick={() => handleOpcionesServicio(true)}
                  >
                    Agregar y Continuar <Plus className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleOpcionesServicio(false)}
                    variant="default"
                  >
                    Agregar y Finalizar <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Detalles de Orden */}
          {step === 'detalles_orden' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">Detalles de la Orden</h3>
                  <p className="text-sm text-gray-500">Resumen de la compra</p>
                </div>

                {/* Lista de servicios */}
                <div className="space-y-4 mb-6">
                  {serviciosSeleccionados.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">{item.service.description}</p>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.quantity} | Precio unitario: {formatPrice(item.service.base_price)}
                        </p>
                        {Object.entries(item.opcionesValues).map(([key, value]) => {
                          if (typeof value === 'boolean' && value) {
                            return <p key={key} className="text-sm text-gray-500">+ {key}</p>;
                          } else if (typeof value === 'string') {
                            return <p key={key} className="text-sm text-gray-500">+ {key}: {value}</p>;
                          }
                          return null;
                        })}
                      </div>
                      <p className="font-medium">{formatPrice(item.subtotal)}</p>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(precioTotal - urgentFee)}</span>
                  </div>
                  {urgentFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Cargo por urgencia (15%):</span>
                      <span>{formatPrice(urgentFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(precioTotal)}</span>
                  </div>
                </div>

                {/* Formulario de detalles */}
                <Form {...ordenForm}>
                  <form onSubmit={ordenForm.handleSubmit(handleCrearOrden)} className="space-y-4">
                    <FormField
                      control={ordenForm.control}
                      name="delivery_format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato de Entrega</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar formato de entrega" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['impresa', 'digital', 'ambos'].map((format) => (
                                <SelectItem key={format} value={format}>
                                  {format.charAt(0).toUpperCase() + format.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={ordenForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridad</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setPriority(value as 'normal' | 'urgente');
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar prioridad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="urgente">Urgente (+15%)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={ordenForm.control}
                      name="advance_payment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anticipo</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              placeholder={`Anticipo (30%) de ${formatPrice(Math.ceil(precioTotal * 0.3))}`}
                              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={ordenForm.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comentarios</FormLabel>
                          <FormControl>
                            <Input placeholder="Comentarios adicionales" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Resumen final */}
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <div className="flex justify-between mb-2">
                        <span>Total:</span>
                        <span className="font-medium">{formatPrice(precioTotal)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Anticipo:</span>
                        <span className="font-medium">{formatPrice(advancePayment)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Restante por pagar:</span>
                        <span>{formatPrice(precioTotal - advancePayment)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep('seleccionar_servicio')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                      </Button>
                      <Button type="submit">
                        Crear Orden <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmation} onOpenChange={(open) => {
        setShowConfirmation(open);
        if (!open) {
          // Resetear el estado cuando se cierra la ventana de confirmación
          setStep('buscar_cliente');
          setIsClienteNuevo(false);
          setClienteEncontrado(null);
          setServicioSeleccionado(null);
          setOpcionesServicio([]);
          setPrecioBase(0);
          setPrecioTotal(0);
          setPrecioAdicionales(0);
          setServiciosSeleccionados([]);
          searchForm.reset();
          nuevoClienteForm.reset();
          servicioForm.reset();
          opcionesServicioForm.reset();
          ordenForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Imprimir o enviar orden</span>
              <DialogClose className="rounded-full hover:bg-gray-100 p-2" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="my-4">
            <div className="bg-gray-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {ticketContent}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <div className="flex space-x-2 justify-end w-full">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                className="flex items-center"
              >
                Enviar por WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NuevaOrdenDialog;
