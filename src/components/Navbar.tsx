import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
      const sectionTop = section.offsetTop - navbarHeight;
      
      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    // Manejar el scroll inicial cuando se carga la página
    const hash = location.hash.replace('#', '');
    if (hash) {
      // Pequeño retraso para asegurar que los elementos estén cargados
      setTimeout(() => {
        scrollToSection(hash);
      }, 100);
    }
  }, [location]);

  return (
    <nav className="bg-studio-beige shadow-md py-4 font-lato sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <Camera className="h-8 w-8 text-studio-brown" />
            <span className="text-xl font-playfair font-semibold text-studio-brown">Foto Réflex</span>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/#inicio" onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }} className="text-studio-brown hover:text-studio-red transition-colors">Inicio</Link>
          <Link to="/#servicios" onClick={(e) => { e.preventDefault(); scrollToSection('servicios'); }} className="text-studio-brown hover:text-studio-red transition-colors">Servicios</Link>
          <Link to="/#portfolio" onClick={(e) => { e.preventDefault(); scrollToSection('portfolio'); }} className="text-studio-brown hover:text-studio-red transition-colors">Portfolio</Link>
          <Link to="/#contacto" onClick={(e) => { e.preventDefault(); scrollToSection('contacto'); }} className="text-studio-brown hover:text-studio-red transition-colors">Contacto</Link>
          <Button asChild className="bg-studio-red hover:bg-studio-brown text-white">
            <Link to="/cliente">Portal Cliente</Link>
          </Button>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-studio-brown">
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-md animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link to="/#inicio" onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }} className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100">Inicio</Link>
            <Link to="/#servicios" onClick={(e) => { e.preventDefault(); scrollToSection('servicios'); }} className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100">Servicios</Link>
            <Link to="/#portfolio" onClick={(e) => { e.preventDefault(); scrollToSection('portfolio'); }} className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100">Portfolio</Link>
            <Link to="/#contacto" onClick={(e) => { e.preventDefault(); scrollToSection('contacto'); }} className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100">Contacto</Link>
            <Button asChild className="bg-studio-red hover:bg-studio-brown text-white w-full">
              <Link to="/cliente" onClick={toggleMenu}>Portal Cliente</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
