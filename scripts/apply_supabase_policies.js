// Este script utiliza la API de Supabase para aplicar manualmente las políticas
// de seguridad a nivel de fila (RLS) en la tabla photo_services
// Ejecución: node scripts/apply_supabase_policies.js

// Instrucciones:
// 1. Guarda este archivo en scripts/apply_supabase_policies.js
// 2. Abre la consola y asegúrate de estar en el directorio raíz del proyecto
// 3. Ejecuta: node scripts/apply_supabase_policies.js
// 4. Comprueba la salida para ver si las políticas se aplicaron correctamente

// Es necesario instalar node-fetch si no está ya instalado:
// npm install node-fetch@2

const fetch = require('node-fetch');

// Configura estos valores con la URL y la clave de servicio (service key) de tu proyecto Supabase
// IMPORTANTE: NUNCA subas este archivo con las credenciales a un repositorio
const SUPABASE_URL = 'https://mmgnrldpwnwqkgavsoih.supabase.co';
const SUPABASE_SERVICE_KEY = ''; // Debes colocar tu clave de servicio (service key) aquí

// Si no tienes la clave de servicio, puedes encontrarla en:
// 1. Ve a supabase.com e inicia sesión
// 2. Selecciona tu proyecto
// 3. Ve a Settings > API
// 4. Copia la "service_role key" (NO la anon key)

async function applyPolicies() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('⛔ ERROR: Debes configurar SUPABASE_SERVICE_KEY en el script antes de ejecutarlo.');
    console.log('Por favor, edita el archivo scripts/apply_supabase_policies.js y agrega tu clave de servicio.');
    return;
  }

  console.log('🔧 Aplicando políticas RLS a la tabla photo_services...');

  try {
    // Habilitar RLS en la tabla
    await executeSql(`
      ALTER TABLE public.photo_services ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ RLS habilitado en la tabla photo_services');

    // Eliminar políticas existentes para evitar conflictos
    await executeSql(`
      DROP POLICY IF EXISTS "Usuarios autenticados pueden ver los servicios" ON public.photo_services;
      DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar servicios" ON public.photo_services;
      DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar servicios" ON public.photo_services;
      DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar servicios" ON public.photo_services;
      DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.photo_services;
    `);
    console.log('✅ Políticas antiguas eliminadas');

    // Crear política para SELECT
    await executeSql(`
      CREATE POLICY "Usuarios autenticados pueden ver los servicios"
      ON public.photo_services
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    console.log('✅ Política SELECT creada');

    // Crear política para INSERT
    await executeSql(`
      CREATE POLICY "Usuarios autenticados pueden insertar servicios"
      ON public.photo_services
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
    `);
    console.log('✅ Política INSERT creada');

    // Crear política para UPDATE
    await executeSql(`
      CREATE POLICY "Usuarios autenticados pueden actualizar servicios"
      ON public.photo_services
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
    `);
    console.log('✅ Política UPDATE creada');

    // Crear política para DELETE
    await executeSql(`
      CREATE POLICY "Usuarios autenticados pueden eliminar servicios"
      ON public.photo_services
      FOR DELETE
      TO authenticated
      USING (true);
    `);
    console.log('✅ Política DELETE creada');

    console.log('\n🎉 ¡Todas las políticas se han aplicado correctamente!');
    console.log('\nAhora deberías poder realizar operaciones CRUD en la tabla photo_services\n');
    console.log('Para comprobar las políticas, ve a Supabase Studio > Authentication > Policies\n');

  } catch (error) {
    console.error('⛔ Error al aplicar las políticas:', error);
    console.error('\nAsegúrate de que:');
    console.error('1. La URL de Supabase es correcta');
    console.error('2. La clave de servicio (service key) es válida');
    console.error('3. La tabla photo_services existe en tu base de datos');
  }
}

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error SQL (${response.status}): ${errorText}`);
  }

  return response;
}

// Ejecutar el script
applyPolicies(); 