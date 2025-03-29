import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Phone, Mail } from 'lucide-react';

const ContactSection = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data: any) => {
    console.log('Form data:', data);
    // In a real app, this would send the data to a server
    alert('Gracias por contactarnos. Nos pondremos en contacto contigo pronto.');
  };
  
  return (
    <section className="py-16 bg-studio-beige/30" id="contacto">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Contacta con Nosotros</h2>
          <p className="max-w-2xl mx-auto text-studio-brown/80">
            Estaremos encantados de hablar contigo sobre tu próximo proyecto fotográfico.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-playfair font-semibold text-studio-brown mb-6">Envíanos un Mensaje</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'El nombre es obligatorio' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                  placeholder="Tu nombre"
                />
                {errors.name && (
                  <span className="text-sm text-studio-red mt-1">{String(errors.name.message)}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'El email es obligatorio',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                  placeholder="Tu email"
                />
                {errors.email && (
                  <span className="text-sm text-studio-red mt-1">{String(errors.email.message)}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Servicio de Interés</label>
                <select
                  id="service"
                  {...register('service', { required: 'Por favor selecciona un servicio' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                >
                  <option value="">Selecciona un servicio</option>
                  <option value="Retratos Profesionales">Retratos Profesionales</option>
                  <option value="Fotografía Familiar">Fotografía Familiar</option>
                  <option value="Eventos Especiales">Eventos Especiales</option>
                  <option value="Restauración Fotográfica">Restauración Fotográfica</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.service && (
                  <span className="text-sm text-studio-red mt-1">{String(errors.service.message)}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  id="message"
                  {...register('message', { required: 'Por favor escribe un mensaje' })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                  placeholder="¿En qué podemos ayudarte?"
                ></textarea>
                {errors.message && (
                  <span className="text-sm text-studio-red mt-1">{String(errors.message.message)}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  id="privacy"
                  type="checkbox"
                  {...register('privacy', { required: 'Debes aceptar la política de privacidad' })}
                  className="h-4 w-4 text-studio-red focus:ring-studio-red border-gray-300 rounded"
                />
                <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                  Acepto la política de privacidad
                </label>
              </div>
              {errors.privacy && (
                <span className="text-sm text-studio-red block">{String(errors.privacy.message)}</span>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-studio-red hover:bg-studio-brown text-white py-3"
              >
                Enviar Mensaje
              </Button>
            </form>
          </div>
          
          {/* Contact Info */}
          <div className="flex flex-col justify-between">
            <div className="mb-8">
              <h3 className="text-2xl font-playfair font-semibold text-studio-brown mb-6">Información de Contacto</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-studio-red flex-shrink-0 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Dirección</h4>
                    <p className="text-studio-brown/80">Av. Rayon norte, frente de la cacaoatera tuzantan<br />Huixtla, Mexico, 30690</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-studio-red flex-shrink-0 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Teléfono</h4>
                    <p className="text-studio-brown/80">+52 964 124 4016</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-studio-red flex-shrink-0 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-studio-brown/80">contacto@estudiofotografico.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-6 w-6 text-studio-red flex-shrink-0 mt-1" />
                  <div className="ml-4">
                    <h4 className="font-semibold">Horario</h4>
                    <p className="text-studio-brown/80">
                      Lunes a Viernes: 9:00 - 20:00<br />
                      Sábados: 10:00 - 15:00<br />
                      Domingos: Cerrado
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-60 rounded-lg overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30810.639394966733!2d-92.48939558620138!3d15.140215166385687!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85920644fbcf9c2f%3A0x9449731c55bedc39!2sHuixtla%2C%20Chis.!5e0!3m2!1ses!2smx!4v1743274265505!5m2!1ses!2smx"
                width="600"
                height="450"
                className="w-full rounded-lg shadow-lg"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
