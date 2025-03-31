-- Función para actualizar registros de photo_services que se ejecuta con permisos elevados
-- Esta función permite actualizar los servicios incluso con RLS habilitado
CREATE OR REPLACE FUNCTION public.update_photo_service(
  p_id UUID,
  p_description TEXT,
  p_base_price NUMERIC,
  p_type TEXT,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Se ejecuta con los permisos del creador, no del usuario que la llama
SET search_path = public
AS $$
DECLARE
  service_exists BOOLEAN;
BEGIN
  -- Verificar si el servicio existe
  SELECT EXISTS(
    SELECT 1 FROM public.photo_services WHERE id = p_id
  ) INTO service_exists;
  
  -- Si el servicio no existe, retornamos falso
  IF NOT service_exists THEN
    RAISE NOTICE 'El servicio con ID % no existe', p_id;
    RETURN FALSE;
  END IF;
  
  -- Actualizar el servicio
  UPDATE public.photo_services
  SET 
    description = COALESCE(p_description, description),
    base_price = COALESCE(p_base_price, base_price),
    type = COALESCE(p_type, type),
    active = COALESCE(p_active, active),
    updated_at = NOW()
  WHERE id = p_id;
  
  -- Verificar si se realizó la actualización
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error al actualizar el servicio: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- Configurar comentario en la función
COMMENT ON FUNCTION public.update_photo_service IS 'Actualiza un registro en photo_services evitando problemas de RLS';

-- Otorgar permisos para que el rol anónimo pueda ejecutar la función
GRANT EXECUTE ON FUNCTION public.update_photo_service TO anon;
GRANT EXECUTE ON FUNCTION public.update_photo_service TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_service TO service_role;

-- Crear política específica para permitir actualizaciones a usuarios autenticados
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.photo_services;

CREATE POLICY "Enable update access for authenticated users"
ON public.photo_services
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Comentario: Esta política permite a cualquier usuario autenticado actualizar cualquier servicio
-- En un entorno de producción, quizás quieras restringir más basándote en roles o propietarios 