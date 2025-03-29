import { createClient } from '@supabase/supabase-js';

// Usar directamente las credenciales (asegúrate de que estas son correctas)
const supabaseUrl = 'https://mmgnrldpwnwqkgavsoih.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZ25ybGRwd253cWtnYXZzb2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNDA0MDEsImV4cCI6MjA1ODcxNjQwMX0.0YwCy8hctxYIKz9xC4rb7PXNSYzlMQOQnnZcVDEbYeU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 