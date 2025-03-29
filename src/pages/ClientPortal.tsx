
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Image, User } from 'lucide-react';

const ClientPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would validate credentials against Supabase
    console.log('Login attempt with:', { email, password });
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16 bg-studio-beige/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Portal Cliente</h1>
            <p className="max-w-2xl mx-auto text-studio-brown/80">
              Accede a tus pedidos, imágenes y gestiona tus servicios desde un solo lugar.
            </p>
          </div>
          
          {!isLoggedIn ? (
            <Card className="max-w-md mx-auto p-6 bg-white shadow-lg">
              <h2 className="text-2xl font-playfair font-semibold text-studio-brown mb-6 text-center">Iniciar Sesión</h2>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                    placeholder="Tu email"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                    placeholder="Tu contraseña"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-studio-red focus:ring-studio-red border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Recordarme
                    </label>
                  </div>
                  
                  <a href="#" className="text-sm text-studio-red hover:text-studio-brown">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-studio-red hover:bg-studio-brown text-white py-3"
                >
                  Iniciar Sesión
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p>¿No tienes una cuenta? <a href="#" className="text-studio-red hover:text-studio-brown">Regístrate aquí</a></p>
              </div>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="orders" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Mis Pedidos
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Fotos
                  </TabsTrigger>
                  <TabsTrigger value="account" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <User className="h-4 w-4 mr-2" />
                    Mi Cuenta
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders">
                  <Card className="p-6">
                    <h3 className="text-xl font-playfair font-semibold text-studio-brown mb-4">Mis Pedidos</h3>
                    
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No tienes pedidos recientes.</p>
                      <Button className="bg-studio-red hover:bg-studio-brown text-white">
                        Explorar Servicios
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="upload">
                  <Card className="p-6">
                    <h3 className="text-xl font-playfair font-semibold text-studio-brown mb-4">Subir Fotos para Restauración</h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Arrastra tus fotos aquí o haz clic para seleccionarlas</p>
                      <p className="text-sm text-gray-400 mb-4">Formatos aceptados: JPG, PNG. Tamaño máximo: 50MB</p>
                      <Button className="bg-studio-red hover:bg-studio-brown text-white">
                        Seleccionar Archivos
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="account">
                  <Card className="p-6">
                    <h3 className="text-xl font-playfair font-semibold text-studio-brown mb-4">Mi Cuenta</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value="Usuario de Ejemplo"
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value="usuario@ejemplo.com"
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline" className="border-studio-brown text-studio-brown hover:bg-studio-brown hover:text-white">
                          Editar Perfil
                        </Button>
                        
                        <Button 
                          className="bg-studio-red hover:bg-studio-brown text-white"
                          onClick={() => setIsLoggedIn(false)}
                        >
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientPortal;
