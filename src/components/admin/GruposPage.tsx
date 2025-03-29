import React, { useEffect, useState } from 'react';
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
import NuevoGrupoDialog from '@/components/admin/grupos/NuevoGrupoDialog';
import DetallesGrupoDialog from '@/components/admin/grupos/DetallesGrupoDialog';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, Trash2, AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Group = Database['public']['Tables']['groups']['Row'];

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select()
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    setIsDeleting(true);
    try {
      // Primero eliminamos los registros de la tabla group_members
      const { error: membersError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupToDelete.id);
      
      if (membersError) throw membersError;
      
      // Luego actualizamos las órdenes para quitar su referencia al grupo
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ group_id: null })
        .eq('group_id', groupToDelete.id);
      
      if (ordersError) throw ordersError;
      
      // Finalmente eliminamos el grupo
      const { error: groupError } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupToDelete.id);
      
      if (groupError) throw groupError;
      
      toast({
        title: "¡Éxito!",
        description: "El grupo ha sido eliminado correctamente",
      });
      
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setGroupToDelete(null);
    }
  };

  const handleStatusUpdate = async (groupId: string, newStatus: Group['status']) => {
    setUpdatingStatus(groupId);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: newStatus })
        .eq('id', groupId);
      
      if (error) throw error;
      
      // Actualizar el estado localmente
      setGroups(groups.map(group => 
        group.id === groupId ? { ...group, status: newStatus } : group
      ));
      
      toast({
        title: "¡Éxito!",
        description: "Estado del grupo actualizado",
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del grupo",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.institution.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <Button onClick={() => setShowNewGroupDialog(true)}>
          Nuevo Grupo
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre o institución..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-4">Cargando grupos...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead>Fecha de Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.institution}</TableCell>
                <TableCell>
                  {format(new Date(group.delivery_date), 'PPP', { locale: es })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex justify-between items-center w-32 ${getStatusColor(group.status)}`}
                        disabled={updatingStatus === group.id}
                      >
                        {getStatusLabel(group.status)}
                        <ChevronsUpDown size={16} className="ml-2 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(group.id, 'pendiente')}
                        className="flex items-center justify-between"
                      >
                        Pendiente
                        {group.status === 'pendiente' && <Check size={16} className="ml-2" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(group.id, 'en_proceso')}
                        className="flex items-center justify-between"
                      >
                        En Proceso
                        {group.status === 'en_proceso' && <Check size={16} className="ml-2" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(group.id, 'completado')}
                        className="flex items-center justify-between"
                      >
                        Completado
                        {group.status === 'completado' && <Check size={16} className="ml-2" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(group.id, 'entregado')}
                        className="flex items-center justify-between"
                      >
                        Entregado
                        {group.status === 'entregado' && <Check size={16} className="ml-2" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(group.id, 'cancelado')}
                        className="flex items-center justify-between"
                      >
                        Cancelado
                        {group.status === 'cancelado' && <Check size={16} className="ml-2" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(group)}
                      className="flex items-center gap-1"
                    >
                      <Eye size={16} />
                      <span>Ver</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex items-center gap-1"
                    >
                      <Link to={`/admin/grupos/${group.id}`}>
                        <ExternalLink size={16} />
                        <span>Detalles</span>
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setGroupToDelete(group)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      <span>Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <NuevoGrupoDialog
        open={showNewGroupDialog}
        onOpenChange={setShowNewGroupDialog}
        onSuccess={fetchGroups}
      />

      <DetallesGrupoDialog
        open={!!selectedGroup}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
        group={selectedGroup}
        onSuccess={fetchGroups}
      />

      <AlertDialog 
        open={!!groupToDelete} 
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Eliminar Grupo</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar el grupo "{groupToDelete?.name}"? Esta acción no eliminará los clientes 
              ni sus órdenes, pero sí eliminará la relación entre ellos y el grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteGroup();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Grupo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 