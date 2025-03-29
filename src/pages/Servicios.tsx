
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServicesSection from '@/components/ServicesSection';

const Servicios = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-16 bg-studio-beige/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Nuestros Servicios</h1>
            <p className="max-w-2xl mx-auto text-studio-brown/80">
              Ofrecemos una amplia gama de servicios fotográficos para capturar tus momentos más especiales.
            </p>
          </div>
          
          <ServicesSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Servicios;
