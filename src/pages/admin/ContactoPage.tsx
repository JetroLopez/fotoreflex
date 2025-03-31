import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_reviewed: boolean;
  created_at: string;
}

const ContactoPage = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewToggle = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_reviewed: !currentValue })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar el estado local
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_reviewed: !currentValue } : msg
      ));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Mensajes de Contacto</h1>
      
      {loading ? (
        <div className="text-center py-8">Cargando mensajes...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay mensajes de contacto
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Estado</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead className="w-[150px]">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow 
                  key={message.id}
                  className={message.is_reviewed ? 'bg-gray-50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={message.is_reviewed}
                      onCheckedChange={() => handleReviewToggle(message.id, message.is_reviewed)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{message.name}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell>{message.phone || '-'}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate">{message.message}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(message.created_at), 'PPp', { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ContactoPage; 