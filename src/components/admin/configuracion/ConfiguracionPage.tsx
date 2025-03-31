import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LockIcon, UnlockIcon } from 'lucide-react';
import ServiciosTab from './ServiciosTab';
import OpcionesTab from './OpcionesTab';
import PaquetesTab from './PaquetesTab';
import ExportacionTab from './ExportacionTab';

// Contraseña hardcodeada (en un sistema real nunca debería hacerse así)
const ADMIN_PASSWORD = 'urias2025';

const ConfiguracionPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('servicios');
  
  // Revisar si hay una sesión almacenada en localStorage al cargar
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('configAuthenticated') === 'true';
    setAuthenticated(isAuthenticated);
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
      localStorage.setItem('configAuthenticated', 'true');
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };
  
  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem('configAuthenticated');
  };
  
  if (!authenticated) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Configuración Administrativa</CardTitle>
            <CardDescription>
              Ingresa la contraseña para acceder a la configuración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                <LockIcon className="mr-2 h-4 w-4" />
                Acceder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuración Administrativa</h1>
        <Button variant="outline" onClick={handleLogout}>
          <UnlockIcon className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="opciones">Opciones de Servicios</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
          <TabsTrigger value="exportacion">Exportación</TabsTrigger>
        </TabsList>
        
        <TabsContent value="servicios">
          <ServiciosTab />
        </TabsContent>
        
        <TabsContent value="opciones">
          <OpcionesTab />
        </TabsContent>
        
        <TabsContent value="paquetes">
          <PaquetesTab />
        </TabsContent>
        
        <TabsContent value="exportacion">
          <ExportacionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracionPage; 