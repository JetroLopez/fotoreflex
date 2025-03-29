
import React from 'react';
import ServiceCard from './ServiceCard';

const services = [
  {
    id: 1,
    title: 'Retratos Profesionales',
    description: 'Sesiones personalizadas para capturar tu esencia única en un ambiente confortable.',
    price: '€120',
    imageSrc: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
  },
  {
    id: 2,
    title: 'Fotografía Familiar',
    description: 'Inmortalizamos los momentos más preciados con tus seres queridos.',
    price: '€150',
    imageSrc: 'https://images.unsplash.com/photo-1500673922987-e212871fec22'
  },
  {
    id: 3,
    title: 'Eventos Especiales',
    description: 'Bodas, cumpleaños, aniversarios y celebraciones capturadas con detalle y elegancia.',
    price: '€500',
    imageSrc: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e'
  },
  {
    id: 4,
    title: 'Restauración Fotográfica',
    description: 'Devolvemos la vida a tus fotografías antiguas o dañadas con técnicas avanzadas.',
    price: '€80',
    imageSrc: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05'
  },
];

const ServicesSection = () => {
  return (
    <section className="py-16 bg-studio-beige/30" id="servicios">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Nuestros Servicios</h2>
          <p className="max-w-2xl mx-auto text-studio-brown/80">
            Ofrecemos una amplia gama de servicios fotográficos para satisfacer tus necesidades, desde retratos hasta restauración de fotos antiguas.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard 
              key={service.id}
              title={service.title}
              description={service.description}
              price={service.price}
              imageSrc={service.imageSrc}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
