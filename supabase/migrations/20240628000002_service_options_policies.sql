-- Habilitar RLS en la tabla service_options
ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;

-- Primero, eliminar cualquier política existente para evitar conflictos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver las opciones" ON public.service_options;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar opciones" ON public.service_options;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar opciones" ON public.service_options;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar opciones" ON public.service_options;

-- Crear políticas para cada operación
-- 1. Política para SELECT
CREATE POLICY "Usuarios autenticados pueden ver las opciones"
ON public.service_options
FOR SELECT
TO authenticated
USING (true);

-- 2. Política para INSERT
CREATE POLICY "Usuarios autenticados pueden insertar opciones"
ON public.service_options
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Política para UPDATE
CREATE POLICY "Usuarios autenticados pueden actualizar opciones"
ON public.service_options
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Política para DELETE
CREATE POLICY "Usuarios autenticados pueden eliminar opciones"
ON public.service_options
FOR DELETE
TO authenticated
USING (true);

-- Si la tabla no existe, crearla para evitar errores
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'service_options' AND schemaname = 'public') THEN
        CREATE TABLE public.service_options (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            service_id UUID NOT NULL REFERENCES public.photo_services(id) ON DELETE CASCADE,
            label TEXT NOT NULL,
            option_type TEXT NOT NULL DEFAULT 'dropdown',
            choices JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
        );
    END IF;
END
$$; 