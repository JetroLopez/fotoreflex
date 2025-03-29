
import React from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'María García',
    role: 'Sesión Familiar',
    content: 'Increíble experiencia. Las fotos capturaron perfectamente la personalidad de cada miembro de nuestra familia. El ambiente fue muy relajado y profesional.',
    imageSrc: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    role: 'Restauración Fotográfica',
    content: 'Restauraron una foto de mis abuelos de hace 70 años. El resultado fue impresionante, parece tomada ayer. Un trabajo excepcional que superó todas mis expectativas.',
    imageSrc: 'https://images.unsplash.com/photo-1458668383970-8ddd3927deed',
  },
  {
    id: 3,
    name: 'Laura Sánchez',
    role: 'Boda',
    content: 'Capturaron cada momento especial de nuestra boda con un estilo único. Las fotos no solo son hermosas, sino que cuentan nuestra historia de una manera muy personal.',
    imageSrc: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
  },
];

const TestimonialSection = () => {
  return (
    <section className="py-16 bg-studio-brown text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">Lo Que Dicen Nuestros Clientes</h2>
          <p className="max-w-2xl mx-auto text-studio-beige/80">
            Nuestros clientes son nuestra mejor carta de presentación. Conoce sus experiencias con nuestro estudio.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-studio-brown/80 p-6 rounded-lg border border-studio-beige/20 shadow-lg">
              <div className="mb-4 flex justify-center">
                <Quote className="h-10 w-10 text-studio-red opacity-80" />
              </div>
              <p className="text-studio-beige mb-6 italic">{testimonial.content}</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src={testimonial.imageSrc} 
                    alt={testimonial.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-playfair font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-studio-beige/70">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
