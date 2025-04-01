import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, UserPlus, Receipt, Trash2, AlertCircle } from 'lucide-react';
import AgregarIntegrantesDialog from './AgregarIntegrantesDialog';
import NuevaOrdenGrupoDialog from './NuevaOrdenGrupoDialog';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { PostgrestError } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type Group = {
  id: string;
  name: string;
  institution: string;
  delivery_date: string;
  status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado';
  comments: string;
  created_at: string;
  updated_at: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

type GroupMember = {
  id: string;
  group_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  customer: Customer;
  order?: any; // Simplificando el tipo de order por ahora
};

type Order = {
  id: string;
  folio: string;
  created_at: string;
  total_price: number;
  status: 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado';
  delivery_format: 'impresa' | 'digital' | 'ambos';
  files_path: string | null;
  priority: 'normal' | 'urgente';
  advance_payment?: number;
  remaining_payment?: number;
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
};

export default function DetalleGrupoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAgregarIntegrantesDialog, setShowAgregarIntegrantesDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [showDeleteGroupAlert, setShowDeleteGroupAlert] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      fetchGroupMembers();
    }
  }, [id]);

  const fetchGroupDetails = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;
      setGroup(data as Group);
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del grupo",
        variant: "destructive"
      });
    }
  };

  const fetchGroupMembers = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('group_id', id) as { data: GroupMember[], error: any };

      if (membersError) throw membersError;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          package:photo_packages(*),
          customer:customer_id(*)
        `)
        .eq('group_id', id);

      if (ordersError) throw ordersError;

      const membersWithOrders = membersData.map(member => {
        const memberOrder = ordersData?.find(o => o.customer_id === member.customer.id);
        return {
          ...member,
          order: memberOrder
        };
      });

      setMembers(membersWithOrders);
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

  const getStatusColor = (status: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      entregado: 'bg-purple-100 text-purple-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || '';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

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

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberToDelete);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Se ha eliminado el integrante del grupo",
      });

      fetchGroupMembers();
    } catch (error) {
      console.error('Error deleting group member:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el integrante del grupo",
        variant: "destructive"
      });
    } finally {
      setMemberToDelete(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;
    
    setDeletingGroup(true);
    try {
      // Primero eliminamos los registros de la tabla group_members
      const { error: membersError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id);
      
      if (membersError) throw membersError;
      
      // Luego actualizamos las órdenes para quitar su referencia al grupo
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ group_id: null })
        .eq('group_id', id);
      
      if (ordersError) throw ordersError;
      
      // Finalmente eliminamos el grupo
      const { error: groupError } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);
      
      if (groupError) throw groupError;
      
      toast({
        title: "¡Éxito!",
        description: "El grupo ha sido eliminado correctamente",
      });
      
      // Redirigir a la página de grupos
      navigate('/admin/grupos');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive"
      });
    } finally {
      setDeletingGroup(false);
      setShowDeleteGroupAlert(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.customer.email && member.customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    member.customer.phone.includes(searchTerm)
  );

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

  if (!group && !loading) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p className="text-gray-500 mb-4">No se encontró el grupo solicitado</p>
        <Button asChild>
          <Link to="/admin/grupos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Grupos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to="/admin/grupos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Grupos
          </Link>
        </Button>
        
        {group && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-1">
                <p className="text-gray-600">{group.institution}</p>
                <span className={`px-2 py-1 rounded-full text-xs inline-block ${getStatusColor(group.status)}`}>
                  {getStatusLabel(group.status)}
                </span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <div>
                <p className="text-sm text-gray-500">Fecha de entrega</p>
                <p className="font-medium">
                  {format(new Date(group.delivery_date), 'PPP', { locale: es })}
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteGroupAlert(true)}
                className="flex items-center gap-1"
              >
                <Trash2 size={16} />
                <span className="hidden md:inline">Eliminar Grupo</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {group && (
        <div className="space-y-6">
          {group.comments && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Comentarios:</p>
              <p className="text-gray-600">{group.comments}</p>
            </div>
          )}

          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h2 className="text-lg font-medium">Integrantes del Grupo</h2>
              <Button 
                onClick={() => setShowAgregarIntegrantesDialog(true)}
                className="w-full md:w-auto flex items-center gap-1"
              >
                <UserPlus size={16} />
                <span>Agregar Integrantes</span>
              </Button>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Buscar por nombre, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:max-w-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-4">Cargando integrantes...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-6 border rounded-lg">
                <p className="text-gray-500 mb-3">
                  {searchTerm 
                    ? 'No se encontraron integrantes que coincidan con la búsqueda' 
                    : 'No hay integrantes en este grupo'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowAgregarIntegrantesDialog(true)}
                    className="flex items-center mx-auto gap-1"
                  >
                    <UserPlus size={16} />
                    <span>Agregar Integrantes</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.customer.name}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{member.customer.phone}</p>
                            {member.customer.email && (
                              <p className="text-gray-500">{member.customer.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.order ? (
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(member.order.status)}`}>
                                {getStatusLabel(member.order.status)}
                              </span>
                              <p className="text-sm font-medium mt-1">
                                {formatPrice(member.order.total_price)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Sin orden</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col md:flex-row gap-2">
                            {member.order ? (
                              <Button
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(member.order as Order);
                                  setShowOrderDetailsDialog(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Receipt size={14} />
                                <span>Ver Orden</span>
                              </Button>
                            ) : (
                              <Button
                                variant="default" 
                                size="sm"
                                onClick={() => handleNuevaOrden(member)}
                                className="flex items-center gap-1"
                              >
                                <Receipt size={14} />
                                <span>Nueva Orden</span>
                              </Button>
                            )}
                            <Button
                              variant="destructive" 
                              size="sm"
                              onClick={() => setMemberToDelete(member.id)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              <span>Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diálogos */}
      <AgregarIntegrantesDialog
        open={showAgregarIntegrantesDialog}
        onOpenChange={setShowAgregarIntegrantesDialog}
        group={group}
        onSuccess={fetchGroupMembers}
      />

      {selectedMember && (
        <NuevaOrdenGrupoDialog
          open={showNuevaOrdenDialog}
          onOpenChange={setShowNuevaOrdenDialog}
          member={selectedMember}
          groupId={id || ''}
          onSuccess={fetchGroupMembers}
        />
      )}

      {/* Diálogo de confirmación para eliminar integrante */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar integrante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al integrante del grupo. No se eliminará al cliente ni sus órdenes asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteGroupAlert} onOpenChange={setShowDeleteGroupAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Eliminar Grupo</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar el grupo "{group?.name}"? Esta acción no eliminará los clientes 
              ni sus órdenes, pero sí eliminará la relación entre ellos y el grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGroup}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteGroup();
              }}
              disabled={deletingGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingGroup ? 'Eliminando...' : 'Eliminar Grupo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para ver detalles de la orden */}
      <Dialog open={showOrderDetailsDialog} onOpenChange={setShowOrderDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Detalles de la Orden</span>
              <DialogClose className="rounded-full hover:bg-gray-100 p-2" />
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <h4 className="font-medium text-gray-500">Anticipo</h4>
                  <p>{formatPrice(selectedOrder.advance_payment || 0)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">Restante</h4>
                  <p>{formatPrice(selectedOrder.remaining_payment || selectedOrder.total_price)}</p>
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

              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-500 mb-2">Servicios</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item, index) => (
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
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-medium text-lg">{formatPrice(selectedOrder.total_price)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 