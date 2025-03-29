import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NuevaOrdenGrupoDialog from './NuevaOrdenGrupoDialog';
import AgregarIntegrantesDialog from './AgregarIntegrantesDialog';
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  order?: Database['public']['Tables']['orders']['Row'];
};
type Customer = Database['public']['Tables']['customers']['Row'];
type Order = Database['public']['Tables']['orders']['Row'] & {
  customer?: {
    name: string;
    phone: string;
  };
  package?: {
    id: string;
    name: string;
    base_price: number;
  };
  selected_options?: string[];
  folio?: string;
  delivery_format?: string;
};

export interface DetallesGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSuccess: () => void;
}

export default function DetallesGrupoDialog({
  open,
  onOpenChange,
  group,
  onSuccess
}: DetallesGrupoDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const [showAgregarIntegrantesDialog, setShowAgregarIntegrantesDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && group) {
      fetchGroupMembers();
    }
  }, [open, group]);

  const fetchGroupMembers = async () => {
    if (!group) return;

    setLoading(true);
    try {
      // Primero obtenemos los miembros del grupo
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*, customer:customers(*)')
        .eq('group_id', group.id);

      if (membersError) throw membersError;

      // Luego obtenemos las órdenes de este grupo
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('group_id', group.id);

      if (ordersError) throw ordersError;

      // Combinamos la información
      const membersWithOrders = membersData.map((member: any) => {
        const order = ordersData.find((o: Order) => o.customer_id === member.customer.id);
        return {
          ...member,
          order
        };
      });

      setMembers(membersWithOrders as GroupMember[]);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    
    setDeleting(true);
    try {
      // Primero eliminamos los registros de la tabla group_members
      const { error: membersError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id);
      
      if (membersError) throw membersError;
      
      // Luego actualizamos las órdenes para quitar su referencia al grupo
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ group_id: null })
        .eq('group_id', group.id);
      
      if (ordersError) throw ordersError;
      
      // Finalmente eliminamos el grupo
      const { error: groupError } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);
      
      if (groupError) throw groupError;
      
      toast({
        title: "¡Éxito!",
        description: "El grupo ha sido eliminado correctamente",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const getStatusColor = (status: Group['status']) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      entregado: 'bg-purple-100 text-purple-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusLabel = (status: Group['status']) => {
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[status];
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  const handleNuevaOrden = (member: GroupMember) => {
    setSelectedMember(member);
    setShowNuevaOrdenDialog(true);
  };

  const handleAgregarIntegrantes = () => {
    setShowAgregarIntegrantesDialog(true);
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id (*),
          package:package_id (*),
          selected_options,
          folio,
          delivery_format
        `)
        .eq('id', order.id)
        .single();

      if (error) throw error;

      setSelectedOrderDetails(data);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Error al cargar detalles de la orden:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la orden",
        variant: "destructive"
      });
    }
  };

  const generateTicketContent = (orden: Order & { package?: any }) => {
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
Orden de Servicio - Grupo: ${formatLine(group?.name || '')}

Folio: ${orden.folio}
Fecha: ${format(new Date(orden.created_at), 'PPP', { locale: es })}
Cliente: ${formatLine(orden.customer?.name || 'Cliente eliminado')}
Teléfono: ${orden.customer?.phone || '-'}

${orden.package ? `PAQUETE:
${formatLine(orden.package.name)} - ${formatPrice(orden.package.base_price)}
${orden.selected_options?.map(opt => `+ ${formatLine(opt)}`).join('\n') || ''}` : ''}

Total: ${formatPrice(orden.total_price)}
Formato de entrega: ${orden.delivery_format}

¡Gracias por su preferencia!
    `;
    return content.trim();
  };

  if (!group) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Grupo</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información del grupo */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{group.name}</h3>
                  <p className="text-gray-500">{group.institution}</p>
                </div>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteAlert(true)}
                  className="flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  <span>Eliminar Grupo</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de Entrega
                  </label>
                  <p className="mt-1">
                    {format(new Date(group.delivery_date), 'PPP', { locale: es })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(group.status)}`}>
                    {getStatusLabel(group.status)}
                  </span>
                </div>
              </div>

              {group.comments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Comentarios
                  </label>
                  <p className="mt-1 text-gray-600">{group.comments}</p>
                </div>
              )}
            </div>

            {/* Lista de miembros */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Miembros del Grupo</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAgregarIntegrantes}
                  className="flex items-center gap-1"
                >
                  <UserPlus size={16} />
                  <span>Agregar Integrantes</span>
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">Cargando miembros...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-gray-50">
                  <p className="text-gray-500 mb-3">No hay miembros en este grupo</p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleAgregarIntegrantes}
                    className="flex items-center mx-auto gap-1"
                  >
                    <UserPlus size={16} />
                    <span>Agregar Integrantes</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{member.customer.name}</h4>
                          <p className="text-sm text-gray-500">{member.customer.phone}</p>
                          {member.customer.email && (
                            <p className="text-sm text-gray-500">{member.customer.email}</p>
                          )}
                          
                          {member.order && (
                            <div className="mt-2">
                              <p className="text-sm">
                                <span className="font-medium">Orden:</span> 
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(member.order.status as any)}`}>
                                  {getStatusLabel(member.order.status as any)}
                                </span>
                              </p>
                              <p className="text-sm font-medium mt-1">
                                {formatPrice(member.order.total_price)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {member.order ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(member.order!)}
                          >
                            Ver Orden
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleNuevaOrden(member)}
                          >
                            Nueva Orden
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedMember && (
        <NuevaOrdenGrupoDialog
          open={showNuevaOrdenDialog}
          onOpenChange={setShowNuevaOrdenDialog}
          member={selectedMember}
          groupId={group.id}
          onSuccess={() => {
            fetchGroupMembers();
            onSuccess();
          }}
        />
      )}

      <AgregarIntegrantesDialog
        open={showAgregarIntegrantesDialog}
        onOpenChange={setShowAgregarIntegrantesDialog}
        group={group}
        onSuccess={() => {
          fetchGroupMembers();
          onSuccess();
        }}
      />
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Eliminar Grupo</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar el grupo "{group.name}"? Esta acción no eliminará los clientes 
              ni sus órdenes, pero sí eliminará la relación entre ellos y el grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteGroup();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Eliminando...' : 'Eliminar Grupo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
          </DialogHeader>
          {selectedOrderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-500">Folio</h4>
                  <p>{selectedOrderDetails.folio}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Fecha</h4>
                  <p>{format(new Date(selectedOrderDetails.created_at), 'PPP', { locale: es })}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Cliente</h4>
                  <p>{selectedOrderDetails.customer?.name || 'Cliente eliminado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Teléfono</h4>
                  <p>{selectedOrderDetails.customer?.phone || '-'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Estado</h4>
                  <p className={`inline-block px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrderDetails.status)}`}>
                    {getStatusLabel(selectedOrderDetails.status)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Formato de entrega</h4>
                  <p>{selectedOrderDetails.delivery_format}</p>
                </div>
              </div>

              {selectedOrderDetails.package && (
                <div>
                  <h4 className="font-medium text-gray-500 mb-2">Paquete</h4>
                  <div className="border rounded p-3">
                    <div className="flex justify-between">
                      <h5 className="font-medium">{selectedOrderDetails.package.name}</h5>
                      <span>{formatPrice(selectedOrderDetails.package.base_price)}</span>
                    </div>
                    {selectedOrderDetails.selected_options?.map((option, index) => (
                      <p key={index} className="text-sm text-gray-500">+ {option}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-medium text-lg">{formatPrice(selectedOrderDetails.total_price)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 