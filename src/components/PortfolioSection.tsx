
import React from 'react';
import Gallery from './Gallery';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PortfolioSection = () => {
  return (
    <section className="py-16" id="portfolio">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Nuestro Portfolio</h2>
          <p className="max-w-2xl mx-auto text-studio-brown/80">
            Explora una selección de nuestras mejores fotografías y descubre nuestro estilo único.
          </p>
        </div>
        
        <Gallery />
        
        <div className="text-center mt-12">
          <Button asChild className="bg-studio-red hover:bg-studio-brown text-white">
            <Link to="/portfolio">Ver Portfolio Completo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
