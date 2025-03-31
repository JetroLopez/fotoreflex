-- Habilitar RLS en la tabla photo_services
ALTER TABLE public.photo_services ENABLE ROW LEVEL SECURITY;

-- Primero, eliminar cualquier política existente para evitar conflictos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver los servicios" ON public.photo_services;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar servicios" ON public.photo_services;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar servicios" ON public.photo_services;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar servicios" ON public.photo_services;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.photo_services;

-- Crear políticas para cada operación
-- 1. Política para SELECT
CREATE POLICY "Usuarios autenticados pueden ver los servicios"
ON public.photo_services
FOR SELECT
TO authenticated
USING (true);

-- 2. Política para INSERT
CREATE POLICY "Usuarios autenticados pueden insertar servicios"
ON public.photo_services
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Política para UPDATE
CREATE POLICY "Usuarios autenticados pueden actualizar servicios"
ON public.photo_services
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Política para DELETE
CREATE POLICY "Usuarios autenticados pueden eliminar servicios"
ON public.photo_services
FOR DELETE
TO authenticated
USING (true);

-- Si la tabla no existe, crearla para evitar errores
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'photo_services' AND schemaname = 'public') THEN
        CREATE TABLE public.photo_services (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            description TEXT NOT NULL,
            base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
            type TEXT DEFAULT 'infantil',
            active BOOLEAN DEFAULT true,
            is_customizable BOOLEAN DEFAULT false,
            customization_note TEXT DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
        );
    END IF;
END
$$; 