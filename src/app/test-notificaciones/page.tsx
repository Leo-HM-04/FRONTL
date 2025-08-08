'use client';

import { useState } from 'react';

export default function TestNotificacionesPage() {
  const [resultado, setResultado] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const crearNotificacionPrueba = async () => {
    setLoading(true);
    setResultado('Creando notificación de prueba...');
    
    try {
      // Simular crear una notificación usando el servicio mejorado
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/test/crear-notificacion-prueba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'solicitud_aprobada',
          prioridad: 'alta',
          concepto: 'Compra de suministros de oficina',
          monto: 15000,
          usuario_emisor: 'Admin de Prueba',
          entidad_id: 123
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResultado(`✅ Notificación de prueba creada exitosamente!\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResultado(`⚠️ Endpoint no disponible (esto es normal, es solo para demostración)\nStatus: ${response.status}`);
      }
    } catch (error) {
      setResultado(`ℹ️ Esto es solo una demostración del sistema.\nEn el sistema real, las notificaciones se crean automáticamente cuando:\n- Se aprueba una solicitud\n- Se rechaza una solicitud\n- Se procesa un pago\n- Se crea un viático\n\nError: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔔 Sistema de Notificaciones Mejoradas - Demo</h1>
      
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        background: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h2>🎯 ¿Qué verás en el sistema real?</h2>
        <p>Cuando un usuario pagador esté autenticado y haga clic en las notificaciones, verá:</p>
        
        <div style={{ marginTop: '15px' }}>
          <h3>📋 Ejemplo de Notificación Detallada:</h3>
          <div style={{
            padding: '15px',
            background: 'white',
            border: '1px solid #ddd',
            borderLeft: '4px solid #28a745',
            borderRadius: '4px',
            margin: '10px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ 
                background: '#28a745', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '12px',
                marginRight: '10px'
              }}>
                ✓ APROBADA
              </span>
              <strong>Nueva solicitud APROBADA lista para pago #123</strong>
            </div>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Concepto:</strong> Compra de suministros de oficina<br/>
              <strong>Monto:</strong> $15,000.00<br/>
              <strong>Aprobada por:</strong> María García (Jefe de Departamento)<br/>
              <strong>Prioridad:</strong> <span style={{color: '#ff6b35'}}>ALTA</span><br/>
              <strong>Hace:</strong> 2 minutos
            </p>
            <div style={{ marginTop: '10px' }}>
              <button style={{
                padding: '5px 10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                marginRight: '5px'
              }}>
                Procesar Pago
              </button>
              <button style={{
                padding: '5px 10px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Marcar como leída
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#d1ecf1', 
        borderRadius: '5px',
        border: '1px solid #bee5eb'
      }}>
        <h2>🔧 Funcionalidades Implementadas:</h2>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Notificaciones Específicas:</strong> Mensajes personalizados según el tipo de acción</li>
          <li><strong>Información Completa:</strong> Concepto, monto, usuario emisor, prioridad</li>
          <li><strong>Filtros Inteligentes:</strong> Todas, No leídas, Pendientes de pago</li>
          <li><strong>Actualización Automática:</strong> Se actualizan cada 30 segundos</li>
          <li><strong>Toasts para Urgencias:</strong> Notificaciones emergentes para pagos críticos</li>
          <li><strong>Contadores en Tiempo Real:</strong> Número de notificaciones por categoría</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={crearNotificacionPrueba}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Creando...' : '🧪 Simular Notificación de Prueba'}
        </button>
      </div>

      {resultado && (
        <div style={{
          padding: '15px',
          background: resultado.includes('✅') ? '#d4edda' : '#fff3cd',
          border: `1px solid ${resultado.includes('✅') ? '#c3e6cb' : '#ffeaa7'}`,
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h3>Resultado:</h3>
          {resultado}
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2>📱 Cómo Acceder al Sistema Completo:</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Ve a la página de login del sistema</li>
          <li>Inicia sesión con un usuario que tenga rol "pagador"</li>
          <li>En el dashboard, haz clic en el ícono de campana (🔔)</li>
          <li>Se abrirá el panel de "Notificaciones de Pagador" con todas las funcionalidades</li>
        </ol>
        
        <p style={{ marginTop: '15px', padding: '10px', background: '#e2e3e5', borderRadius: '4px' }}>
          <strong>💡 Tip:</strong> También puedes ir a <code>/test-pagador</code> para ver una simulación del layout del pagador.
        </p>
      </div>
    </div>
  );
}
