import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

type Group = Database['public']['Tables']['groups']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

// Esquema para validación de un nuevo cliente
const nuevoClienteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  email: z.string().email("Ingresa un email válido").or(z.string().length(0)).optional(),
  address: z.string().optional(),
});

type NuevoClienteValues = z.infer<typeof nuevoClienteSchema>;

// Tipo para un cliente en el formulario de spreadsheet
interface ClienteRow extends NuevoClienteValues {
  id?: string; // Para clientes existentes
  isNew: boolean;
  isValid: boolean;
}

interface AgregarIntegrantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSuccess: () => void;
}

export default function AgregarIntegrantesDialog({
  open,
  onOpenChange,
  group,
  onSuccess
}: AgregarIntegrantesDialogProps) {
  const [clientes, setClientes] = useState<ClienteRow[]>([{
    name: '',
    phone: '',
    email: '',
    address: '',
    isNew: true,
    isValid: false
  }]);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [selectedExistingCustomers, setSelectedExistingCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'nuevos' | 'existentes'>('nuevos');
  const { toast } = useToast();

  // Formulario para validar cada cliente nuevo
  const form = useForm<NuevoClienteValues>({
    resolver: zodResolver(nuevoClienteSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: ''
    }
  });

  useEffect(() => {
    if (open && group) {
      fetchExistingCustomers();
      // Iniciar con una fila vacía
      setClientes([{
        name: '',
        phone: '',
        email: '',
        address: '',
        isNew: true,
        isValid: false
      }]);
      setSelectedExistingCustomers([]);
    }
  }, [open, group]);

  const fetchExistingCustomers = async () => {
    if (!group) return;

    setLoading(true);
    try {
      // Primero obtenemos los miembros actuales del grupo para excluirlos
      const { data: currentMembers, error: membersError } = await supabase
        .from('group_members')
        .select('customer_id')
        .eq('group_id', group.id);

      if (membersError) throw membersError;

      // Obtenemos la lista de IDs de clientes que ya están en el grupo
      const existingCustomerIds = currentMembers.map(member => member.customer_id);

      // Ahora obtenemos los clientes que NO están en el grupo
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;

      // Filtramos para mostrar solo clientes que no están en el grupo
      const availableCustomers = data.filter(
        customer => !existingCustomerIds.includes(customer.id)
      );

      setExistingCustomers(availableCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes existentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva fila vacía
  const agregarFila = () => {
    setClientes([...clientes, {
      name: '',
      phone: '',
      email: '',
      address: '',
      isNew: true,
      isValid: false
    }]);
  };

  // Eliminar una fila
  const eliminarFila = (index: number) => {
    if (clientes.length === 1) {
      // Si es la única fila, la dejamos vacía en lugar de eliminarla
      setClientes([{
        name: '',
        phone: '',
        email: '',
        address: '',
        isNew: true,
        isValid: false
      }]);
    } else {
      const nuevosClientes = [...clientes];
      nuevosClientes.splice(index, 1);
      setClientes(nuevosClientes);
    }
  };

  // Actualizar un campo en una fila
  const actualizarCampo = (index: number, campo: keyof NuevoClienteValues, valor: string) => {
    const nuevosClientes = [...clientes];
    nuevosClientes[index] = {
      ...nuevosClientes[index],
      [campo]: valor
    };

    // Validar que la fila sea válida
    const clienteSchema = nuevoClienteSchema.safeParse({
      name: nuevosClientes[index].name,
      phone: nuevosClientes[index].phone,
      email: nuevosClientes[index].email || '',
      address: nuevosClientes[index].address || ''
    });

    nuevosClientes[index].isValid = clienteSchema.success;
    
    setClientes(nuevosClientes);
  };

  // Manejar selección de clientes existentes
  const handleSelectExistingCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedExistingCustomers(prev => [...prev, customerId]);
    } else {
      setSelectedExistingCustomers(prev => prev.filter(id => id !== customerId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExistingCustomers(filteredExistingCustomers.map(customer => customer.id));
    } else {
      setSelectedExistingCustomers([]);
    }
  };

  // Guardar clientes y añadirlos al grupo
  const handleGuardarClientes = async () => {
    if (!group) return;

    // Validar que haya al menos un cliente válido
    const clientesValidos = clientes.filter(c => c.isValid && c.name.trim() !== '');
    
    if (activeTab === 'nuevos' && clientesValidos.length === 0) {
      toast({
        title: "Error",
        description: "No hay clientes válidos para agregar",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === 'existentes' && selectedExistingCustomers.length === 0) {
      toast({
        title: "Error",
        description: "No hay clientes seleccionados para agregar",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Si estamos agregando clientes nuevos
      if (activeTab === 'nuevos') {
        // Primero creamos los clientes
        const clientesData = clientesValidos.map(cliente => ({
          name: cliente.name.trim(),
          phone: cliente.phone.trim(),
          email: cliente.email?.trim() || null,
          address: cliente.address?.trim() || null
        }));

        const { data: nuevosClientes, error: errorClientes } = await supabase
          .from('customers')
          .insert(clientesData)
          .select();

        if (errorClientes) throw errorClientes;

        // Luego los agregamos al grupo
        if (nuevosClientes && nuevosClientes.length > 0) {
          const miembrosData = nuevosClientes.map(cliente => ({
            group_id: group.id,
            customer_id: cliente.id
          }));

          const { error: errorMiembros } = await supabase
            .from('group_members')
            .insert(miembrosData);

          if (errorMiembros) throw errorMiembros;

          toast({
            title: "¡Éxito!",
            description: `Se han agregado ${nuevosClientes.length} nuevos clientes al grupo`,
          });
        }
      } else {
        // Si estamos agregando clientes existentes
        const miembrosData = selectedExistingCustomers.map(customerId => ({
          group_id: group.id,
          customer_id: customerId
        }));

        const { error } = await supabase
          .from('group_members')
          .insert(miembrosData);

        if (error) throw error;

        toast({
          title: "¡Éxito!",
          description: `Se han agregado ${selectedExistingCustomers.length} clientes existentes al grupo`,
        });
      }

      // Limpiar y cerrar
      setClientes([{
        name: '',
        phone: '',
        email: '',
        address: '',
        isNew: true,
        isValid: false
      }]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding customers to group:', error);
      toast({
        title: "Error",
        description: "No se pudieron agregar los clientes al grupo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar clientes existentes según término de búsqueda
  const filteredExistingCustomers = existingCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar integrantes al grupo {group?.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'nuevos' | 'existentes')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="nuevos">Nuevos Integrantes</TabsTrigger>
            <TabsTrigger value="existentes">Clientes Existentes</TabsTrigger>
          </TabsList>

          {/* Tab de Nuevos Integrantes - Formato Spreadsheet */}
          <TabsContent value="nuevos" className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          value={cliente.name}
                          onChange={(e) => actualizarCampo(index, 'name', e.target.value)}
                          placeholder="Nombre completo"
                          className={cliente.name && !cliente.isValid ? "border-red-300" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={cliente.phone}
                          onChange={(e) => actualizarCampo(index, 'phone', e.target.value)}
                          placeholder="Teléfono"
                          className={cliente.phone && !cliente.isValid ? "border-red-300" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={cliente.email || ''}
                          onChange={(e) => actualizarCampo(index, 'email', e.target.value)}
                          placeholder="Email (opcional)"
                          className={cliente.email && !cliente.isValid ? "border-red-300" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={cliente.address || ''}
                          onChange={(e) => actualizarCampo(index, 'address', e.target.value)}
                          placeholder="Dirección (opcional)"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarFila(index)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={agregarFila}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Otra Fila
              </Button>

              <Button
                type="button"
                onClick={handleGuardarClientes}
                disabled={submitting || clientes.filter(c => c.isValid).length === 0}
                className="flex items-center"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Agregar {clientes.filter(c => c.isValid).length} Integrante(s)
              </Button>
            </div>
          </TabsContent>

          {/* Tab de Clientes Existentes */}
          <TabsContent value="existentes" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Input
                placeholder="Buscar por nombre, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-4">Cargando clientes...</div>
            ) : filteredExistingCustomers.length === 0 ? (
              <div className="text-center py-4">
                {searchTerm 
                  ? 'No se encontraron clientes que coincidan con la búsqueda' 
                  : 'No hay clientes disponibles para agregar al grupo'
                }
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={
                            filteredExistingCustomers.length > 0 && 
                            selectedExistingCustomers.length === filteredExistingCustomers.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Correo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExistingCustomers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedExistingCustomers.includes(customer.id)}
                            onCheckedChange={(checked) => 
                              handleSelectExistingCustomer(customer.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGuardarClientes}
                disabled={selectedExistingCustomers.length === 0 || submitting}
                className="flex items-center"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Agregar {selectedExistingCustomers.length} Cliente(s)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 