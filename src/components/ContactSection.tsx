import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Función simple para generar un hash compatible con el navegador
const generateHash = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generar hash del mensaje usando Web Crypto API
      const messageHash = await generateHash(formData.email + formData.message);

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          ...formData,
          message_hash: messageHash
        })
        .select();

      if (error) {
        if (error.code === '23505') { // Código de error de duplicado
          toast({
            title: "Mensaje duplicado",
            description: "Ya has enviado este mensaje anteriormente.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "¡Mensaje enviado!",
          description: "Nos pondremos en contacto contigo pronto.",
        });
        // Limpiar el formulario
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor intenta más tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-studio-beige/20 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-playfair font-bold text-studio-brown mb-4">
            Contáctanos
          </h2>
          <p className="text-gray-600">
            ¿Tienes alguna pregunta o quieres agendar una sesión? 
            Escríbenos y te responderemos lo antes posible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
          <div>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre completo *"
              required
            />
          </div>
          <div>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Correo electrónico *"
              required
            />
          </div>
          <div>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Teléfono (opcional)"
            />
          </div>
          <div>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tu mensaje *"
              required
              className="min-h-[150px]"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-studio-brown hover:bg-studio-brown/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;
