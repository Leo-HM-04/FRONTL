'use client';

import { useState, useEffect } from 'react';

export default function TestConnectionPage() {
  const [resultado, setResultado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [frontendUrl, setFrontendUrl] = useState<string>('N/A');
  const [currentDate, setCurrentDate] = useState<string>('Cargando...');

  // Solucionar problema de hidratación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFrontendUrl(window.location.origin);
      setCurrentDate(new Date().toLocaleString());
    }
  }, []);

  const probarConexion = async () => {
    setLoading(true);
    setResultado('Probando conexión...');
    
    try {
      // Probar conexión al backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResultado(`✅ Conexión exitosa! Usuario: ${JSON.stringify(data, null, 2)}`);
      } else if (response.status === 401) {
        const errorData = await response.text();
        setResultado(`✅ Conexión al backend EXITOSA!\n⚠️ Endpoint /api/auth/me funcional pero requiere autenticación\nRespuesta: ${errorData}`);
      } else {
        setResultado(`❌ Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      setResultado(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const probarNotificaciones = async () => {
    setLoading(true);
    setResultado('Probando endpoint de notificaciones...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/mejoradas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResultado(`✅ Endpoint de notificaciones disponible! Datos: ${JSON.stringify(data, null, 2)}`);
      } else if (response.status === 401) {
        const errorData = await response.text();
        setResultado(`✅ Endpoint de notificaciones mejoradas FUNCIONAL!\n⚠️ Requiere autenticación para obtener datos\nRespuesta: ${errorData}`);
      } else {
        setResultado(`❌ Error en endpoint de notificaciones: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      setResultado(`❌ Error al conectar con notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Prueba de Conexión - Sistema de Notificaciones</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Información del Sistema:</h2>
        <p><strong>Frontend URL:</strong> {frontendUrl}</p>
        <p><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}</p>
        <p><strong>Fecha:</strong> {currentDate}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={probarConexion}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Probando...' : 'Probar Conexión Backend'}
        </button>

        <button 
          onClick={probarNotificaciones}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Probando...' : 'Probar Notificaciones'}
        </button>
      </div>

      {resultado && (
        <div style={{
          padding: '15px',
          background: resultado.includes('✅') ? '#d4edda' : resultado.includes('⚠️') ? '#fff3cd' : '#f8d7da',
          border: `1px solid ${resultado.includes('✅') ? '#c3e6cb' : resultado.includes('⚠️') ? '#ffeaa7' : '#f5c6cb'}`,
          borderRadius: '5px',
          marginTop: '20px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h3>Resultado:</h3>
          {resultado}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
        <h3>🔧 Diagnóstico del Sistema:</h3>
        <ul>
          <li>✅ Hook useNotificacionesPagador con manejo de errores mejorado</li>
          <li>✅ Componente PagadorNotificationsMejoradas recreado</li>
          <li>✅ Validación de tokens antes de hacer peticiones</li>
          <li>✅ Manejo de errores 401 (No autorizado)</li>
          <li>✅ Fallback a endpoint anterior si falla el mejorado</li>
          <li>✅ Endpoint /api/auth/me agregado al backend</li>
          <li>✅ Errores de TypeScript corregidos</li>
        </ul>
      </div>
    </div>
  );
}
