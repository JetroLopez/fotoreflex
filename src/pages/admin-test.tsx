import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const AdminTest = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Obtener lista de tablas
  const fetchTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_tables');
      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error al obtener tablas:', error);
      setMessage('Error al obtener tablas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      setMessage('Error al obtener clientes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar órdenes
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      setMessage('Error al obtener órdenes');
    } finally {
      setLoading(false);
    }
  };

  // Añadir datos de prueba
  const addTestData = async () => {
    try {
      setLoading(true);
      setMessage('Agregando datos de prueba...');

      // Insertar cliente de prueba
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([
          { 
            name: 'Cliente de Prueba', 
            phone: '9621461109'
          }
        ])
        .select();

      if (customerError) throw customerError;
      
      if (customerData && customerData.length > 0) {
        // Insertar orden de prueba
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              customer_id: customerData[0].id,
              folio: '250016',
              status: 'Completado',
              created_at: new Date().toISOString()
            }
          ])
          .select();

        if (orderError) throw orderError;
        
        setMessage('Datos de prueba agregados con éxito');
        
        // Recargar datos
        await fetchCustomers();
        await fetchOrders();
      }
    } catch (error) {
      console.error('Error al agregar datos de prueba:', error);
      setMessage(`Error al agregar datos de prueba: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchCustomers();
    fetchOrders();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Administración de Prueba</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          <div className="space-y-4">
            <Button 
              onClick={addTestData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Agregar Datos de Prueba'}
            </Button>
            
            <Button 
              onClick={() => {
                fetchTables();
                fetchCustomers();
                fetchOrders();
              }} 
              variant="outline" 
              disabled={loading}
              className="w-full"
            >
              Recargar Datos
            </Button>
            
            {message && (
              <div className="bg-gray-100 p-4 rounded-md">
                <p>{message}</p>
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Tablas</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Tablas en la base de datos:</h3>
              <ul className="list-disc pl-5">
                {tables.map((table, index) => (
                  <li key={index}>{table.table_name}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Clientes ({customers.length}):</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="border p-2">ID</th>
                      <th className="border p-2">Nombre</th>
                      <th className="border p-2">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="border p-2">{customer.id}</td>
                        <td className="border p-2">{customer.name}</td>
                        <td className="border p-2">{customer.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Órdenes ({orders.length}):</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="border p-2">ID</th>
                      <th className="border p-2">Cliente ID</th>
                      <th className="border p-2">Folio</th>
                      <th className="border p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="border p-2">{order.id}</td>
                        <td className="border p-2">{order.customer_id}</td>
                        <td className="border p-2">{order.folio}</td>
                        <td className="border p-2">{order.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminTest; 