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
  'pendiente': 'Nuestro equipo está por comenzar a trabajar en tu pedido.',
  'en_proceso': 'Estamos trabajando con tu pedido, visita esta página nuevamente en uno o dos días.',
  'completado': 'Tu pedido está listo, puedes pasar a recogerlo al local o comunicate con nosotros.',
  'entregado': 'Tu pedido ya fue entregado, agradecemos su preferencia.',
  'cancelado': 'Tu pedido fue cancelado, si esto es un error comunicate con nosotros.'
};

const ClientPortal = () => {
  const [folio, setFolio] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Buscar la orden directamente por folio
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name)
        `)
        .eq('folio', folio)
        .single();

      if (orderError) {
        console.error('Error buscando orden:', orderError);
        toast({
          title: "Error en la búsqueda",
          description: "Hubo un problema al buscar la orden. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
        return;
      }

      if (!orderData) {
        toast({
          title: "Orden no encontrada",
          description: "No se encontró ninguna orden con el folio proporcionado.",
          variant: "destructive"
        });
        return;
      }

      // Formatear los datos para mostrarlos en el popup
      const formattedOrderData = {
        client_name: orderData.customer?.name || 'Cliente',
        order_description: `Orden #${orderData.folio}`,
        status: orderData.status,
        created_at: orderData.created_at,
        total_price: orderData.total_price,
        remaining_payment: orderData.remaining_payment || 0
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
              Ingresa el número de folio para consultar el estado de tu pedido
            </p>
          </div>
          
          <Card className="max-w-md mx-auto p-6 bg-white shadow-lg">
            <form onSubmit={handleValidation} className="space-y-6">
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
                    <p className="capitalize">{orderDetails.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Fecha</h4>
                    <p>{new Date(orderDetails.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Monto Total</h4>
                    <p>${orderDetails.total_price.toFixed(2)}</p>
                  </div>
                  {orderDetails.remaining_payment > 0 && (
                    <div>
                      <h4 className="font-semibold">Pago Restante</h4>
                      <p>${orderDetails.remaining_payment.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">{statusMessages[orderDetails.status]}</p>
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
