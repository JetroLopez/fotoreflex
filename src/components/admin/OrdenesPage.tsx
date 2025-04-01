import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, MoreHorizontal, Printer, Save } from 'lucide-react';
import NuevaOrdenDialog from './ordenes/NuevaOrdenDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Tipos para las órdenes
type Order = {
  id: string;
  folio: string;
  created_at: string;
  total_price: number;
  status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado';
  delivery_format: 'impresa' | 'digital' | 'ambos';
  files_path: string | null;
  priority: 'normal' | 'urgente';
  customer: {
    name: string;
    phone: string;
  } | null;
  order_items?: {
    service_id: string;
    quantity: number;
    unit_price: number;
    selected_options: Record<string, any>;
    service: {
      description: string;
    };
  }[];
  group?: {
    name: string;
  };
  package?: {
    id: string;
    name: string;
    base_price: number;
  };
  selected_options?: string[];
  advance_payment?: number;
  remaining_payment?: number;
};

const OrdenesPage = () => {
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordenes, setOrdenes] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [editedOrders, setEditedOrders] = useState<{ [key: string]: { 
    status?: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado';
    files_path?: string | null;
  } }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const sortOrders = (orders: Order[]) => {
    return orders.sort((a, b) => {
      // Si ambas están entregadas o canceladas, ordenar por fecha
      if ((a.status === 'entregado' || a.status === 'cancelado') && 
          (b.status === 'entregado' || b.status === 'cancelado')) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      // Si solo a está entregada o cancelada, va al final
      if (a.status === 'entregado' || a.status === 'cancelado') return 1;
      
      // Si solo b está entregada o cancelada, va al final
      if (b.status === 'entregado' || b.status === 'cancelado') return -1;
      
      // Si ambas están completadas, ordenar por fecha
      if (a.status === 'completado' && b.status === 'completado') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      // Si solo a está completada, va después de pendientes/en proceso pero antes de entregadas/canceladas
      if (a.status === 'completado') return 1;
      
      // Si solo b está completada, va después de pendientes/en proceso pero antes de entregadas/canceladas
      if (b.status === 'completado') return -1;
      
      // Para el resto (pendientes y en proceso), priorizar urgentes
      if (a.priority === 'urgente' && b.priority !== 'urgente') return -1;
      if (a.priority !== 'urgente' && b.priority === 'urgente') return 1;
      
      // Si ambas tienen la misma prioridad, ordenar por estado (pendiente antes que en proceso)
      if (a.status === 'pendiente' && b.status === 'en_proceso') return -1;
      if (a.status === 'en_proceso' && b.status === 'pendiente') return 1;
      
      // Finalmente ordenar por fecha
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          folio,
          created_at,
          total_price,
          status,
          delivery_format,
          priority,
          group_id,
          customer:customer_id (
            name,
            phone
          ),
          group:group_id (
            name
          ),
          package:package_id (*),
          selected_options,
          order_items (
            service_id,
            quantity,
            unit_price,
            selected_options,
            service:service_id (
              description
            )
          ),
          advance_payment,
          remaining_payment
        `) as { data: Order[] | null; error: any };

      if (error) throw error;

      setOrdenes(sortOrders(data || []));
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setEditedOrders(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], status: newStatus as 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado' }
    }));
    setHasChanges(true);
  };

  const handleFilesPathChange = (orderId: string, fullPath: string) => {
    setEditedOrders(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], files_path: fullPath }
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      for (const [orderId, changes] of Object.entries(editedOrders)) {
        const { error } = await supabase
          .from('orders')
          .update(changes)
          .eq('id', orderId);
        
        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Los cambios se guardaron correctamente",
      });

      setEditedOrders({});
      setHasChanges(false);
      fetchOrdenes();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    }
  };

  // Formatear número como precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
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

  // Obtener color de acuerdo al estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'entregado':
        return 'bg-purple-100 text-purple-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener etiqueta de estado en español
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En proceso';
      case 'completado':
        return 'Completado';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Función para extraer el nombre de la subcarpeta
  const getSubfolderName = (path: string | null) => {
    if (!path) return '';
    const parts = path.split('\\');
    return parts.slice(-2).join('\\');
  };

  // Función para generar el contenido del ticket
  const generateTicketContent = (orden: Order) => {
    // Función para agregar saltos de línea cuando el texto sea muy largo
    const formatLine = (text: string, maxLength = 30) => {
      if (!text || text.length <= maxLength) return text;
      
      const words = text.split(' ');
      let result = '';
      let currentLine = '';
      
      words.forEach(word => {
        if ((currentLine + word).length > maxLength) {
          result += currentLine.trim() + '\n';
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
      
      return result + currentLine.trim();
    };

    const content = `
FOTO RÉFLEX
Orden de Servicio${orden.group ? ` - Grupo: ${formatLine(orden.group.name)}` : ''}

Folio: ${orden.folio}
Fecha: ${formatDate(orden.created_at)}
Cliente: ${formatLine(orden.customer?.name || 'Cliente eliminado')}
Teléfono: ${orden.customer?.phone || '-'}

${orden.package ? `PAQUETE:
${formatLine(orden.package.name)} - ${formatPrice(orden.package.base_price)}
${orden.selected_options?.map(opt => `+ ${formatLine(opt)}`).join('\n') || ''}` : 
`SERVICIOS:
${orden.order_items?.map(item => `
${formatLine(item.service.description)}
Cantidad: ${item.quantity}
${Object.entries(item.selected_options || {})
  .map(([key, value]) => {
    if (typeof value === 'boolean' && value) return `+ ${formatLine(key)}`;
    if (typeof value === 'string') return `+ ${formatLine(key)}: ${formatLine(value)}`;
    return '';
  })
  .filter(Boolean)
  .join('\n')}
Precio unitario: ${formatPrice(item.unit_price)}
`).join('\n') || ''}`}

Total: ${formatPrice(orden.total_price)}
Formato de entrega: ${orden.delivery_format}
${orden.priority === 'urgente' ? '¡URGENTE!' : ''}

¡Gracias por su preferencia!
    `;
    return content.trim();
  };

  // Función para manejar la impresión
  const handlePrint = (orden: Order) => {
    setSelectedOrder(orden);
    setShowPrintDialog(true);
  };

  // Función para mostrar detalles
  const handleShowDetails = (orden: Order) => {
    setSelectedOrder(orden);
    setShowDetailsDialog(true);
  };

  // Filtrar órdenes
  const filteredOrdenes = ordenes.filter(orden => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      orden.folio.toLowerCase().includes(searchLower) ||
      orden.customer?.name.toLowerCase().includes(searchLower) ||
      orden.customer?.phone.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Órdenes</h2>
        <div className="flex gap-2">
          <Button 
            onClick={saveChanges}
            disabled={!hasChanges}
            className={hasChanges ? "bg-studio-brown hover:bg-studio-brown/90 text-white" : "opacity-50"}
          >
            <Save className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
          <Button 
            onClick={() => setShowNuevaOrdenDialog(true)}
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Orden
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio o nombre..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-studio-brown focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-md shadow p-6 text-center">
          <div className="animate-pulse text-gray-500">Cargando órdenes...</div>
        </div>
      ) : filteredOrdenes.length === 0 ? (
        <div className="bg-white rounded-md shadow p-6 text-center">
          <p className="text-center text-gray-500">
            No hay órdenes registradas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archivos</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrdenes.map((orden) => (
                  <tr 
                    key={orden.id}
                    className={orden.status === 'cancelado' || orden.status === 'entregado' ? 'opacity-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{orden.folio}</div>
                      {orden.priority === 'urgente' && (
                        <div className="text-xs font-medium text-red-600">URGENTE</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{orden.customer?.name || 'Cliente eliminado'}</div>
                      <div className="text-xs text-gray-500">
                        {orden.customer?.phone || '-'}
                        {orden.group?.name && ` - ${orden.group.name}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(orden.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatPrice(orden.total_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={editedOrders[orden.id]?.status || orden.status}
                        onValueChange={(value) => handleStatusChange(orden.id, value)}
                      >
                        <SelectTrigger className={`w-[140px] ${getStatusColor(editedOrders[orden.id]?.status || orden.status)}`}>
                          <SelectValue>{getStatusLabel(editedOrders[orden.id]?.status || orden.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_proceso">En proceso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        placeholder="Pega la ruta de tu carpeta"
                        value={editedOrders[orden.id]?.files_path || orden.files_path || ''}
                        onChange={(e) => handleFilesPathChange(orden.id, e.target.value)}
                        className="w-[200px]"
                      />
                      {(editedOrders[orden.id]?.files_path || orden.files_path) && (
                        <a
                          href={`file:///${editedOrders[orden.id]?.files_path || orden.files_path}`}
                          className="text-xs text-blue-600 hover:underline block mt-1"
                          onClick={(e) => {
                            e.preventDefault();
                            const path = editedOrders[orden.id]?.files_path || orden.files_path;
                            if (path) {
                              window.open(`file:///${path}`, '_blank');
                            }
                          }}
                        >
                          {getSubfolderName(editedOrders[orden.id]?.files_path || orden.files_path)}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShowDetails(orden)}>
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(orden)}>
                            Imprimir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog para crear nueva orden */}
      <NuevaOrdenDialog 
        open={showNuevaOrdenDialog} 
        onOpenChange={setShowNuevaOrdenDialog}
        onOrderCreated={() => {
          // Actualizar los datos después de 5 segundos
          setTimeout(() => {
            fetchOrdenes();
          }, 5000);
        }}
      />

      {/* Dialog para ver detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Detalles de la Orden</span>
              <DialogClose className="rounded-full hover:bg-gray-100 p-2" />
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-500">Folio</h4>
                  <p>{selectedOrder.folio}</p>
                  {selectedOrder.priority === 'urgente' && (
                    <span className="text-xs font-medium text-red-600">URGENTE</span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Fecha</h4>
                  <p>{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Cliente</h4>
                  <p>{selectedOrder.customer?.name || 'Cliente eliminado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Teléfono</h4>
                  <p>{selectedOrder.customer?.phone || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Estado</h4>
                  <p className={`inline-block px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Formato de entrega</h4>
                  <p>{selectedOrder.delivery_format}</p>
                </div>
              </div>

              {selectedOrder.package && (
                <div>
                  <h4 className="font-medium text-gray-500 mb-2">Paquete</h4>
                  <div className="border rounded p-3">
                    <div className="flex justify-between">
                      <h5 className="font-medium">{selectedOrder.package.name}</h5>
                      <span>{formatPrice(selectedOrder.package.base_price)}</span>
                    </div>
                    {selectedOrder.selected_options?.map((option, index) => (
                      <p key={index} className="text-sm text-gray-500">+ {option}</p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-500 mb-2">Servicios</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between">
                        <h5 className="font-medium">{item.service.description}</h5>
                        <span>{formatPrice(item.unit_price)}</span>
                      </div>
                      <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                      {Object.entries(item.selected_options || {}).map(([key, value]) => (
                        <p key={key} className="text-sm text-gray-500">
                          {typeof value === 'boolean' && value ? `+ ${key}` : ''}
                          {typeof value === 'string' ? `+ ${key}: ${value}` : ''}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="font-medium text-lg">{formatPrice(selectedOrder.total_price)}</span>
                  </div>
                  {selectedOrder.advance_payment !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Anticipo</span>
                      <span className="text-sm">{formatPrice(selectedOrder.advance_payment)}</span>
                    </div>
                  )}
                  {selectedOrder.remaining_payment !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Restante</span>
                      <span className="text-sm">{formatPrice(selectedOrder.remaining_payment)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para imprimir orden */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
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
                {selectedOrder ? generateTicketContent(selectedOrder) : ''}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <div className="flex space-x-2 justify-end w-full">
              <Button
                variant="outline"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow && selectedOrder) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Ticket - ${selectedOrder.folio}</title>
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
                        <pre>${generateTicketContent(selectedOrder)}</pre>
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
                }}
                className="flex items-center"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button
                onClick={() => {
                  if (selectedOrder) {
                    const text = encodeURIComponent(generateTicketContent(selectedOrder));
                    const phoneMatch = generateTicketContent(selectedOrder).match(/Teléfono: (.*)/);
                    if (phoneMatch) {
                      const phoneNumber = phoneMatch[1].replace(/\D/g, '');
                      const formattedPhone = phoneNumber.startsWith('52') ? phoneNumber : `52${phoneNumber}`;
                      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
                      window.open(whatsappUrl, '_blank');
                    } else {
                      toast({
                        title: "Error",
                        description: "No se encontró el número de teléfono en el ticket",
                        variant: "destructive"
                      });
                    }
                  }
                }}
                className="flex items-center"
              >
                Enviar por WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdenesPage;
