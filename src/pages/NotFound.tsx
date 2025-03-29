
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center bg-studio-beige/20 py-16">
        <div className="text-center max-w-md mx-auto px-4">
          <Camera className="h-20 w-20 text-studio-red mx-auto mb-6" />
          <h1 className="text-6xl font-playfair font-bold text-studio-brown mb-4">404</h1>
          <p className="text-xl text-studio-brown/80 mb-8">
            Parece que esta fotografía no está en nuestro álbum. La página que buscas no existe o ha sido movida.
          </p>
          <Button asChild className="bg-studio-red hover:bg-studio-brown text-white">
            <Link to="/">Volver al Inicio</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
