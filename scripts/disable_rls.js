// Este script deshabilita temporalmente RLS en la tabla photo_services
// ¡IMPORTANTE! Solo usar este script en entornos de desarrollo, nunca en producción
// Ejecución: node scripts/disable_rls.js

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

async function disableRls() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('⛔ ERROR: Debes configurar SUPABASE_SERVICE_KEY en el script antes de ejecutarlo.');
    console.log('Por favor, edita el archivo scripts/disable_rls.js y agrega tu clave de servicio.');
    return;
  }

  console.log('🔧 Deshabilitando RLS en la tabla photo_services...');
  console.log('⚠️ ADVERTENCIA: Esto elimina todas las restricciones de seguridad. Úsalo solo en desarrollo.');

  try {
    // Deshabilitar RLS en la tabla
    await executeSql(`
      ALTER TABLE public.photo_services DISABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ RLS deshabilitado en la tabla photo_services');

    console.log('\n🎉 ¡RLS deshabilitado correctamente!');
    console.log('\nAhora puedes realizar operaciones CRUD sin restricciones en la tabla photo_services');
    console.log('RECUERDA: Vuelve a habilitar RLS antes de desplegar a producción\n');
    console.log('Para habilitar RLS nuevamente, usa:');
    console.log('node scripts/apply_supabase_policies.js\n');

  } catch (error) {
    console.error('⛔ Error al deshabilitar RLS:', error);
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
disableRls(); 