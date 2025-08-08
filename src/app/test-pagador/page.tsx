'use client';

import { useState, useEffect } from 'react';
import { PagadorLayout } from '@/components/layout/PagadorLayout';

export default function TestPagadorPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular un usuario pagador para la prueba
    const usuarioSimulado = {
      id_usuario: 1,
      nombre: 'Usuario Pagador de Prueba',
      email: 'pagador@test.com',
      rol: 'pagador',
      verificado: true,
      activo: true
    };
    
    setUsuario(usuarioSimulado);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Prueba del Sistema de Notificaciones para Pagador</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e8f4fd', 
        border: '1px solid #bee5eb', 
        borderRadius: '5px' 
      }}>
        <h2>👤 Usuario Simulado:</h2>
        <p><strong>Nombre:</strong> {usuario?.nombre}</p>
        <p><strong>Email:</strong> {usuario?.email}</p>
        <p><strong>Rol:</strong> {usuario?.rol}</p>
        <p><strong>Estado:</strong> {usuario?.activo ? 'Activo' : 'Inactivo'}</p>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#d4edda', 
        border: '1px solid #c3e6cb', 
        borderRadius: '5px' 
      }}>
        <h2>🔔 Prueba de Notificaciones:</h2>
        <p>Para ver las notificaciones mejoradas:</p>
        <ol>
          <li>Haz clic en el ícono de campana (🔔) en la parte superior</li>
          <li>Se abrirá el panel de "Notificaciones de Pagador"</li>
          <li>Verás filtros: Todas, No Leídas, Pendientes Pago</li>
          <li>Las notificaciones mostrarán información detallada como:
            <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
              <li>• Tipo de notificación (solicitud_aprobada, viatico_aprobado, etc.)</li>
              <li>• Prioridad (critica, alta, normal, baja)</li>
              <li>• Usuario emisor</li>
              <li>• ID de entidad (#123)</li>
              <li>• Fecha formateada</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '5px' 
      }}>
        <h2>📊 Características del Sistema Mejorado:</h2>
        <ul>
          <li>✅ <strong>Notificaciones específicas por rol:</strong> Solo ve notificaciones relevantes para pagadores</li>
          <li>✅ <strong>Información detallada:</strong> Monto, concepto, usuario que aprobó</li>
          <li>✅ <strong>Priorización visual:</strong> Colores según prioridad (crítica=rojo, alta=naranja)</li>
          <li>✅ <strong>Filtros inteligentes:</strong> Pendientes de pago, no leídas, etc.</li>
          <li>✅ <strong>Toasts automáticos:</strong> Notificaciones emergentes para pagos urgentes</li>
          <li>✅ <strong>Contadores en tiempo real:</strong> Número de notificaciones por categoría</li>
        </ul>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#f8d7da', 
        border: '1px solid #f5c6cb', 
        borderRadius: '5px' 
      }}>
        <h2>⚠️ Nota Importante:</h2>
        <p>Esta es una página de prueba que simula un usuario pagador. En el sistema real:</p>
        <ul>
          <li>• Necesitas estar autenticado con credenciales reales</li>
          <li>• Tu usuario debe tener el rol "pagador"</li>
          <li>• Las notificaciones se cargan desde la base de datos real</li>
          <li>• Los datos se actualizan cada 30 segundos automáticamente</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '8px', 
        border: '2px dashed #6c757d' 
      }}>
        <h2>🚀 Próximos Pasos:</h2>
        <p>Para ver el sistema completo en acción:</p>
        <ol>
          <li>Inicia sesión con un usuario que tenga rol "pagador"</li>
          <li>Ve al dashboard de pagador</li>
          <li>Haz clic en el ícono de notificaciones</li>
          <li>Explora las diferentes funciones del panel mejorado</li>
        </ol>
      </div>
    </div>
  );
}
