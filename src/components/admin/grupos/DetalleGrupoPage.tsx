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

type Group = Database['public']['Tables']['groups']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export default function DetalleGrupoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(GroupMember & { customer: Customer, order?: Order })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAgregarIntegrantesDialog, setShowAgregarIntegrantesDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<(GroupMember & { customer: Customer }) | null>(null);
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [showDeleteGroupAlert, setShowDeleteGroupAlert] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
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
      
      setGroup(data);
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
      // Primero obtenemos los miembros del grupo
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*, customer:customers(*)')
        .eq('group_id', id);

      if (membersError) throw membersError;

      // Luego obtenemos las órdenes de este grupo
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('group_id', id);

      if (ordersError) throw ordersError;

      // Combinamos la información
      const membersWithOrders = membersData.map((member: any) => {
        const order = ordersData.find((o: Order) => o.customer_id === member.customer.id);
        return {
          ...member,
          order
        };
      });

      setMembers(membersWithOrders as any);
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

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  const handleNuevaOrden = (member: (GroupMember & { customer: Customer })) => {
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to="/admin/grupos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Grupos
          </Link>
        </Button>
        
        {group && (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-gray-600">{group.institution}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(group.status)}`}>
                  {getStatusLabel(group.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                className="flex items-center gap-1 ml-4"
              >
                <Trash2 size={16} />
                <span>Eliminar Grupo</span>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Integrantes del Grupo</h2>
              <Button 
                onClick={() => setShowAgregarIntegrantesDialog(true)}
                className="flex items-center gap-1"
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
                className="max-w-sm"
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
                        <div className="flex space-x-2">
                          {member.order ? (
                            <Button
                              variant="outline" 
                              size="sm"
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
    </div>
  );
} 