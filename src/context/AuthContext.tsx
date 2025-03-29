import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar perfil del usuario
  const fetchProfile = async (userId: string) => {
    try {
      // En lugar de consultar "profiles", vamos a usar getUser y confiar en los metadatos
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error al obtener usuario:', userError);
        // Proporcionar un perfil por defecto
        return createDefaultProfile(userId);
      }
      
      // Usar los metadatos del usuario si están disponibles
      if (userData.user && userData.user.user_metadata) {
        return {
          id: userId,
          first_name: userData.user.user_metadata.first_name || 'Usuario',
          last_name: userData.user.user_metadata.last_name || '',
          role: userData.user.user_metadata.role || 'user',
          created_at: userData.user.created_at,
          updated_at: new Date().toISOString()
        };
      }
      
      // Si no hay metadatos, crear un perfil por defecto
      return createDefaultProfile(userId);
      
    } catch (error) {
      console.error('Error en fetchProfile:', error);
      return createDefaultProfile(userId);
    }
  };

  // Función auxiliar para crear un perfil por defecto
  const createDefaultProfile = (userId: string) => {
    return {
      id: userId,
      first_name: 'Usuario',
      last_name: '',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Establecer estado inicial
    const initializeAuth = async () => {
      setLoading(true);
      
      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
      
      setLoading(false);
    };

    // Inicializar
    initializeAuth();

    // Suscribirse a cambios en autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
