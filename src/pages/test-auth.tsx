import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/auth';

export default function TestAuth() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [notifications, setNotifications] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    
    console.log('Token actual:', token);
    
    if (!token) {
      setAuthStatus({ error: 'No hay token de autenticación' });
      return;
    }

    try {
      // Probar endpoint de usuario actual
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setAuthStatus({ success: true, user: userData });
        
        // Si la autenticación funciona, probar notificaciones
        testNotifications(token);
      } else {
        const errorData = await userRes.text();
        setAuthStatus({ error: `Error de autenticación: ${userRes.status} - ${errorData}` });
      }
    } catch (error: any) {
      setAuthStatus({ error: `Error de conexión: ${error.message}` });
    }
  };

  const testNotifications = async (token: string) => {
    try {
      // Probar endpoint mejorado
      const mejRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/mejoradas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (mejRes.ok) {
        const mejData = await mejRes.json();
        setNotifications({ 
          mejoradas: { success: true, data: mejData, count: mejData.length },
          endpoint: 'mejoradas'
        });
      } else {
        // Probar endpoint normal
        const normRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (normRes.ok) {
          const normData = await normRes.json();
          setNotifications({ 
            normal: { success: true, data: normData, count: normData.length },
            mejoradas: { error: `Error: ${mejRes.status} - ${await mejRes.text()}` },
            endpoint: 'normal'
          });
        } else {
          setNotifications({ 
            error: `Ambos endpoints fallaron. Mejorado: ${mejRes.status}, Normal: ${normRes.status}`
          });
        }
      }
    } catch (error: any) {
      setNotifications({ error: `Error de conexión: ${error.message}` });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Prueba de Autenticación y Notificaciones</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Estado de Autenticación:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      {notifications && (
        <div>
          <h2>Estado de Notificaciones:</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(notifications, null, 2)}
          </pre>
        </div>
      )}

      <button 
        onClick={checkAuth}
        style={{ 
          padding: '10px 20px', 
          background: '#007acc', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Probar Conexión
      </button>
    </div>
  );
}
