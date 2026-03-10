
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, XCircle, Table } from 'lucide-react';

export default async function DbDebugPage() {
  let connectionStatus: 'success' | 'error' = 'success';
  let errorMessage = '';
  let userCount = 0;
  let tablesFound: string[] = [];

  try {
    // Intento de conexión y conteo simple
    userCount = await prisma.user.count();
    
    // Opcional: Listar algunas tablas para confirmar mapeo
    // En MySQL podemos usar SHOW TABLES
    const tables = await prisma.$queryRawUnsafe<{ [key: string]: string }[]>('SHOW TABLES');
    tablesFound = tables.map(t => Object.values(t)[0]);
    
  } catch (error: any) {
    connectionStatus = 'error';
    errorMessage = error.message || 'Error desconocido al conectar';
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Diagnóstico de Base de Datos</h1>
      </div>

      <Card className={connectionStatus === 'success' ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Estado de Conexión</CardTitle>
          {connectionStatus === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'success' ? "default" : "destructive"}>
              {connectionStatus === 'success' ? "CONECTADO" : "ERROR"}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">MySQL via Prisma</span>
          </div>
          
          {connectionStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs font-mono overflow-auto max-h-40">
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {connectionStatus === 'success' && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                <Table className="w-4 h-4" />
                Resumen de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Usuarios registrados:</span>
                <span className="text-lg font-bold">{userCount}</span>
              </div>
              
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Tablas detectadas en DB:</span>
                <div className="flex flex-wrap gap-2">
                  {tablesFound.slice(0, 10).map((table) => (
                    <Badge key={table} variant="outline" className="text-[10px] bg-white">
                      {table}
                    </Badge>
                  ))}
                  {tablesFound.length > 10 && (
                    <span className="text-[10px] text-muted-foreground">... y {tablesFound.length - 10} más</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <div className="text-xs text-blue-800">
              <p className="font-bold mb-1">💡 Todo listo</p>
              <p>La conexión es estable y Prisma puede leer tus modelos. Ya puedes empezar a integrar datos reales en tus rutas.</p>
            </div>
          </div>
        </>
      )}
      
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          Entorno: {process.env.NODE_ENV}
        </p>
      </div>
    </div>
  );
}
