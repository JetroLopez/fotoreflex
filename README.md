# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8a03f5de-2ca3-48b0-b7d8-5606b5a27dcb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8a03f5de-2ca3-48b0-b7d8-5606b5a27dcb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8a03f5de-2ca3-48b0-b7d8-5606b5a27dcb) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# FotoReflex

## Solución para problemas de Seguridad a Nivel de Fila (RLS) en Supabase

Este documento explica cómo solucionar los problemas de permisos y actualizaciones con las políticas RLS de Supabase.

### Problema identificado

Estamos enfrentando el siguiente error al intentar insertar o actualizar registros en las tablas de Supabase:

```
new row violates row-level security policy for table "photo_services"
```

Este error ocurre porque:

1. La tabla tiene RLS habilitado
2. No hay políticas adecuadas para INSERT o UPDATE
3. Supabase intenta hacer un SELECT después de cada INSERT/UPDATE para devolver los datos actualizados

### Soluciones implementadas

#### 1. Uso de `{ returning: 'minimal' }` en operaciones de base de datos

La solución más sencilla es usar la opción `{ returning: 'minimal' }` en todas las operaciones de INSERT, UPDATE y DELETE. Esto evita que Supabase intente hacer un SELECT después de la operación y elimina la necesidad de tener una política de SELECT.

```typescript
const { error } = await supabase
  .from('photo_services')
  .insert(data)
  .options({ returning: 'minimal' });
```

#### 2. Scripts para gestionar políticas RLS

Se han creado dos scripts para gestionar las políticas RLS:

- **scripts/apply_supabase_policies.js**: Aplica todas las políticas necesarias para permitir operaciones CRUD a usuarios autenticados.
- **scripts/disable_rls.js**: Deshabilita temporalmente RLS para desarrollo (no usar en producción).

Para usarlos:

1. Instala las dependencias: `npm install node-fetch@2`
2. Edita el script y agrega tu clave de servicio (service_role key)
3. Ejecuta: `node scripts/apply_supabase_policies.js`

#### 3. Función helper para actualizaciones robustas

Se ha creado una función helper `updatePhotoService` en `src/integrations/supabase/client.ts` que intenta múltiples métodos para actualizar datos:

1. Actualización con token de autenticación explícito
2. Actualización directa estándar
3. Técnica de alteración previa
4. Llamada a procedimiento remoto (RPC)
5. Actualización con encabezados especiales
6. Verificación del estado actual

```typescript
const result = await updatePhotoService(id, data);
if (result.success) {
  console.log(`Actualización exitosa con método: ${result.method}`);
}
```

#### 4. Función RPC para bypass de RLS

Se ha creado una función SQL que se ejecuta con permisos de SECURITY DEFINER para actualizar registros, evitando las restricciones de RLS:

```sql
CREATE OR REPLACE FUNCTION public.update_photo_service(
  p_id UUID,
  p_description TEXT,
  p_base_price NUMERIC,
  p_type TEXT,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- ...código de función...
$$;
```

Para aplicar esta función, ejecuta el archivo de migración: `supabase/migrations/20240628000000_update_service_function.sql`

### Cómo verificar las políticas en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto
3. Ve a Authentication > Policies
4. Verifica que existan políticas para SELECT, INSERT, UPDATE y DELETE en las tablas relevantes

### Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Avoiding RLS Policy Errors in Supabase](https://nikofischer.com/supabase-error-row-level-security-policy)
