import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { DownloadIcon, DatabaseIcon, LoaderIcon, AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
}

const ExportacionTab = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tablas disponibles para exportar
    const availableTables: TableInfo[] = [
      { 
        name: 'photo_services', 
        displayName: 'Servicios Fotográficos', 
        description: 'Servicios básicos que ofrece el estudio' 
      },
      { 
        name: 'service_options', 
        displayName: 'Opciones de Servicios', 
        description: 'Opciones configurables para cada servicio' 
      },
      { 
        name: 'photo_packages', 
        displayName: 'Paquetes Fotográficos', 
        description: 'Paquetes de servicios con precios especiales' 
      },
      { 
        name: 'customers', 
        displayName: 'Clientes', 
        description: 'Información de los clientes del estudio' 
      },
      { 
        name: 'orders', 
        displayName: 'Órdenes', 
        description: 'Pedidos realizados por los clientes' 
      },
      { 
        name: 'groups', 
        displayName: 'Grupos', 
        description: 'Grupos de sesiones fotográficas (escuelas, eventos, etc.)' 
      }
    ];
    
    setTables(availableTables);
  }, []);

  const handleExport = async () => {
    if (!selectedTable) {
      setError('Selecciona una tabla para exportar');
      return;
    }
    
    try {
      setExporting(true);
      setError(null);

      // Verificar si la tabla existe primero
      const { error: tableError } = await supabase
        .from(selectedTable)
        .select('count')
        .limit(1)
        .single();
        
      if (tableError && (tableError.code === '400' || tableError.code === '404')) {
        toast({
          title: 'Tabla no encontrada',
          description: 'La tabla seleccionada no existe en la base de datos.',
          variant: 'destructive',
        });
        setExporting(false);
        return;
      }

      // Si la tabla existe, procedemos a obtener los datos
      const { data, error: fetchError } = await supabase
        .from(selectedTable)
        .select('*');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'La tabla seleccionada no contiene registros para exportar.',
        });
        setExporting(false);
        return;
      }

      let fileContent: string;
      let fileName: string;
      let fileType: string;

      if (format === 'csv') {
        // Convertir a CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
          Object.values(row).map(value => 
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          ).join(',')
        );
        fileContent = [headers, ...rows].join('\n');
        fileName = `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.csv`;
        fileType = 'text/csv';
      } else {
        // Formato JSON
        fileContent = JSON.stringify(data, null, 2);
        fileName = `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.json`;
        fileType = 'application/json';
      }

      // Crear y descargar el archivo
      const blob = new Blob([fileContent], { type: fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportación completada',
        description: `Se ha exportado la tabla ${selectedTable} en formato ${format.toUpperCase()}.`,
      });
    } catch (err) {
      console.error('Error al exportar datos:', err);
      setError('Hubo un problema al exportar los datos. Por favor, intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Exportación de Datos</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Exportar tabla</CardTitle>
          <CardDescription>
            Selecciona una tabla para exportar sus datos en formato CSV o JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tabla a exportar</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una tabla" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.name} value={table.name}>
                      <div className="flex flex-col">
                        <span>{table.displayName}</span>
                        <span className="text-xs text-gray-500">{table.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato</label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="format-csv"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="mr-2"
                  />
                  <label htmlFor="format-csv">CSV</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="format-json"
                    value="json"
                    checked={format === 'json'}
                    onChange={() => setFormat('json')}
                    className="mr-2"
                  />
                  <label htmlFor="format-json">JSON</label>
                </div>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleExport}
              disabled={exporting || !selectedTable}
              className="w-full"
            >
              {exporting ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Exportar Datos
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <AlertCircleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <h4 className="font-semibold">Nota de seguridad</h4>
                <p className="mt-1">
                  Asegúrate de no compartir los datos exportados con personas no autorizadas. 
                  Esta información puede contener datos sensibles de clientes y del negocio.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Edge Functions</CardTitle>
          <CardDescription>
            Para integraciones avanzadas o procesamiento de datos del lado del servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Las Edge Functions de Supabase permiten procesar datos directamente en el servidor antes de 
            exportarlos, lo que es ideal para conjuntos de datos grandes o con necesidades específicas de 
            procesamiento.
          </p>
          
          <Button variant="outline" className="w-full" disabled>
            <DatabaseIcon className="mr-2 h-4 w-4" />
            Usar Edge Functions (Próximamente)
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Esta funcionalidad requiere configuración adicional y estará disponible en una futura actualización.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportacionTab; 