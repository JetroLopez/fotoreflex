import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface OrderStatus {
  status: 'Pendiente' | 'En proceso' | 'Completado' | 'Entregado' | 'Cancelado';
  message: string;
}

const statusMessages: Record<string, string> = {
  'Pendiente': 'Nuestro equipo está por comenzar a trabajar en tu pedido.',
  'En proceso': 'Estamos trabajando con tu pedido, visita esta página nuevamente en uno o dos días.',
  'Completado': 'Tu pedido está listo, puedes pasar a recogerlo al local o comunicate con nosotros.',
  'Entregado': 'Tu pedido ya fue entregado, agradecemos su preferencia.',
  'Cancelado': 'Tu pedido fue cancelado, si esto es un error comunicate con nosotros.'
};

const ClientPortal = () => {
  const [phone, setPhone] = useState('');
  const [folio, setFolio] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Normalizar el número de teléfono (eliminar espacios, guiones, etc.)
      const normalizedPhone = phone.replace(/\D/g, '');
      console.log('Buscando cliente con teléfono normalizado:', normalizedPhone);

      // Primero, buscar todos los clientes para ver la estructura
      const { data: allCustomers, error: allCustomersError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

      if (allCustomersError) {
        console.error('Error obteniendo estructura de clientes:', allCustomersError);
      } else {
        console.log('Estructura de la tabla customers:', allCustomers);
      }

      // Buscar el cliente sin usar .single() para evitar el error cuando no hay resultados
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${normalizedPhone},phone.eq.${phone},phone.ilike.%${normalizedPhone.slice(-8)}%`);

      if (customerError) {
        console.error('Error buscando cliente:', customerError);
        toast({
          title: "Error en la búsqueda",
          description: "Hubo un problema al buscar el cliente. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
        return;
      }

      console.log('Resultados de la búsqueda de clientes:', customerData);

      if (!customerData || customerData.length === 0) {
        toast({
          title: "Cliente no encontrado",
          description: "No se encontró ningún cliente con el número de teléfono proporcionado.",
          variant: "destructive"
        });
        return;
      }

      // Tomar el primer cliente encontrado
      const customer = customerData[0];
      console.log('Cliente encontrado:', customer);

      // Obtener estructura de la tabla orders
      const { data: sampleOrders, error: sampleOrdersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

      if (sampleOrdersError) {
        console.error('Error obteniendo estructura de órdenes:', sampleOrdersError);
      } else {
        console.log('Estructura de la tabla orders:', sampleOrders);
      }

      // Buscar la orden con el folio
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('folio', folio);

      if (orderError) {
        console.error('Error buscando orden:', orderError);
        toast({
          title: "Error en la búsqueda",
          description: "Hubo un problema al buscar la orden. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
        return;
      }

      console.log('Resultados de la búsqueda de órdenes:', orderData);

      if (!orderData || orderData.length === 0) {
        toast({
          title: "Orden no encontrada",
          description: "No se encontró ninguna orden con el folio proporcionado para este cliente.",
          variant: "destructive"
        });
        return;
      }

      // Tomar la primera orden encontrada
      const order = orderData[0];
      console.log('Orden encontrada:', order);
      
      // Formatear los datos para mostrarlos en el popup
      const formattedOrderData = {
        client_name: customer.name || customer.fullname || customer.nombres || customer.full_name || 'Cliente',
        order_description: `Orden #${order.folio}`,
        status: order.status,
        created_at: order.created_at
      };
      
      setOrderDetails(formattedOrderData);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Error general:', error);
      toast({
        title: "Error",
        description: "Hubo un error al buscar tu pedido. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleDigitalDownload = () => {
    toast({
      title: "Solicitud enviada",
      description: "Tu orden fue solicitada con nuestro equipo para su descarga digital, en breve nos comunicaremos con usted por WhatsApp."
    });
  };

  const handleReprint = () => {
    toast({
      title: "Solicitud enviada",
      description: "Tu orden fue solicitada para reimpresión, en breve confirmaremos tu orden via WhatsApp y te notificaremos cuando puedas pasar por tus fotos."
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16 bg-studio-beige/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">
              Dale seguimiento a tus fotografías
            </h1>
            <p className="max-w-2xl mx-auto text-studio-brown/80">
              Ingresa tu número de teléfono y folio para consultar el estado de tu pedido
            </p>
          </div>
          
          <Card className="max-w-md mx-auto p-6 bg-white shadow-lg">
            <form onSubmit={handleValidation} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                  placeholder="Ingresa tu número de teléfono"
                />
              </div>
              
              <div>
                <label htmlFor="folio" className="block text-sm font-medium text-gray-700 mb-1">Folio</label>
                <input
                  id="folio"
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                  placeholder="Ingresa el número de folio"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-studio-red hover:bg-studio-brown text-white py-3"
              >
                Consultar Pedido
              </Button>
            </form>
          </Card>

          <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Detalles del Pedido</DialogTitle>
              </DialogHeader>
              {orderDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Cliente</h4>
                    <p>{orderDetails.client_name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Orden</h4>
                    <p>{orderDetails.order_description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Estado</h4>
                    <p>{orderDetails.status}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Fecha</h4>
                    <p>{new Date(orderDetails.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{statusMessages[orderDetails.status]}</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleDigitalDownload}
                      className="flex-1 bg-studio-red hover:bg-studio-brown text-white"
                    >
                      Solicitar descarga digital
                    </Button>
                    <Button
                      onClick={handleReprint}
                      className="flex-1 bg-studio-brown hover:bg-studio-red text-white"
                    >
                      Reimprimir
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientPortal;
