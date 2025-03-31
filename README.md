# Foto Réflex - Sistema de Gestión Fotográfica

## Descripción del Proyecto

Foto Réflex es una aplicación web completa diseñada para estudios fotográficos profesionales, que permite la gestión integral de servicios fotográficos, pedidos y relación con clientes. El sistema está optimizado para el manejo eficiente de un estudio fotográfico profesional ubicado en Huixtla, Chiapas.

## Características Principales

### Portal Público
- **Página de Inicio**: Presentación profesional del estudio y sus servicios
- **Catálogo de Servicios**: Muestra detallada de servicios fotográficos disponibles
- **Portafolio**: Galería de trabajos realizados
- **Sección de Contacto**: Información de ubicación y medios de contacto

### Portal Cliente
- **Gestión de Cuenta**: Registro e inicio de sesión de clientes
- **Visualización de Órdenes**: Seguimiento de pedidos en curso
- **Historial de Servicios**: Registro de servicios contratados
- **Descarga de Fotografías**: Acceso a fotografías digitales

### Panel Administrativo
- **Gestión de Órdenes**: Control completo de pedidos y su estado
- **Administración de Clientes**: Base de datos de clientes y sus historiales
- **Gestión de Servicios**: Configuración de servicios y opciones
- **Control de Grupos**: Organización de sesiones grupales
- **Configuración del Sistema**: Personalización de opciones y precios

## Tecnologías Utilizadas

El proyecto está construido con tecnologías modernas:
- **Frontend**: React con TypeScript
- **Estilizado**: Tailwind CSS y shadcn-ui
- **Construcción**: Vite
- **Base de Datos**: Supabase
- **Autenticación**: Sistema integrado con Supabase

## Instalación y Desarrollo Local

Para ejecutar el proyecto localmente, sigue estos pasos:

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# Navegar al directorio del proyecto
cd fotoreflex

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Requisitos Previos
- Node.js (versión recomendada: 16.x o superior)
- npm (incluido con Node.js)
- Cuenta en Supabase para la base de datos

## Estructura del Proyecto

```
fotoreflex/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/         # Páginas principales
│   ├── context/       # Contextos de React
│   ├── lib/           # Utilidades y configuraciones
│   └── types/         # Definiciones de tipos TypeScript
├── public/           # Archivos estáticos
└── ...
```

## Configuración

El proyecto requiere las siguientes variables de entorno:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## Características de Seguridad
- Autenticación segura de usuarios
- Protección de rutas administrativas
- Manejo seguro de sesiones
- Encriptación de datos sensibles

## Funcionalidades Principales

### Gestión de Servicios
- Configuración flexible de servicios fotográficos
- Opciones personalizables para cada servicio
- Sistema de precios dinámico

### Gestión de Órdenes
- Creación y seguimiento de órdenes
- Estado en tiempo real
- Notificaciones de actualizaciones

### Administración de Clientes
- Perfiles detallados de clientes
- Historial de servicios
- Gestión de grupos y eventos

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

## Soporte y Contacto

Para soporte técnico o consultas sobre el sistema, contactar a:
- Email: jetro_lopez@outlook.com
- WhatsApp: 961 146 1109

## Licencia

Todos los derechos reservados © Jetro Alfonso Lopez
