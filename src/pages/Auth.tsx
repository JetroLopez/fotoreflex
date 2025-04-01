import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Ingresa un email válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Ingresa un email válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  firstName: z.string().min(1, { message: 'El nombre es requerido' }),
  lastName: z.string().min(1, { message: 'El apellido es requerido' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  useEffect(() => {
    // Comprobar si el usuario ya tiene sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate('/admin');
      }
    });

    // Suscribirse a cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          navigate('/admin');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo a Foto Réflex",
      });
    } catch (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Ocurrió un error al intentar iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            role: 'operator', // Rol por defecto
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });
    } catch (error) {
      toast({
        title: "Error al registrarse",
        description: error.message || "Ocurrió un error al intentar crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-studio-beige/10 p-4">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-2">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Vanamo_Logo.svg/480px-Vanamo_Logo.svg.png" 
            alt="Foto Réflex Logo" 
            className="h-12 w-12 object-contain"
          />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-studio-brown">Foto Réflex</h1>
        <p className="text-studio-brown/80">Sistema de Administración</p>
      </div>

      <Card className="w-full max-w-md">
        <Tabs defaultValue="login">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            <CardDescription className="mt-4">
              Accede al sistema para administrar órdenes y clientes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                          <Input placeholder="tu@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-studio-brown text-white" 
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                          <Input placeholder="tu@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-studio-brown text-white" 
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : "Registrarse"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </CardContent>
          
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            Foto Réflex &copy; {new Date().getFullYear()}
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
