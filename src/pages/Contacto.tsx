
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';

const Contacto = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-16 bg-studio-beige/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Contáctanos</h1>
            <p className="max-w-2xl mx-auto text-studio-brown/80">
              Estamos aquí para hacer realidad tu visión fotográfica. Ponte en contacto con nosotros.
            </p>
          </div>
          
          <ContactSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contacto;
