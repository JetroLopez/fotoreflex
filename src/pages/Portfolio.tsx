
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Gallery from '@/components/Gallery';
import { Button } from '@/components/ui/button';

const Portfolio = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-16 bg-studio-beige/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Nuestro Portfolio Completo</h1>
            <p className="max-w-2xl mx-auto text-studio-brown/80">
              Explora nuestra colección de fotografías y descubre el estilo único que ofrecemos a nuestros clientes.
            </p>
          </div>
          
          <div className="mb-12">
            <Gallery />
          </div>
          
          <div className="text-center mt-8">
            <Button className="bg-studio-red hover:bg-studio-brown text-white" asChild>
              <a href="#contacto">Solicita tu Sesión</a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;
