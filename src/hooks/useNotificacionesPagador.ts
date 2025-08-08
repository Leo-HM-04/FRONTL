/* ──────────────────────────────────────────────────────────────
   Hook de Notificaciones Mejoradas para Pagador
   Sistema de notificaciones en tiempo real con información específica
   ────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { getAuthToken } from '@/utils/auth';

interface NotificacionMejorada {
  id: number;
  mensaje: string;
  tipo: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'critica';
  entidad?: string;
  entidad_id?: number;
  leida: boolean;
  fecha: string;
  emisor?: {
    nombre: string;
    rol: string;
  };
}

interface NotificacionRaw {
  id_notificacion?: number;
  id?: number;
  mensaje: string;
  tipo?: string;
  prioridad?: string;
  entidad?: string;
  entidad_id?: number;
  leida: boolean;
  fecha?: string;
  fecha_creacion?: string;
  emisor_nombre?: string;
  emisor_rol?: string;
}

export const useNotificacionesPagador = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionMejorada[]>([]);
  const [loading, setLoading] = useState(false);
  const prevNotiIds = useRef<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = () => getAuthToken();

  // Función para normalizar notificaciones de ambos endpoints
  const normalizarNotificaciones = (data: NotificacionRaw[]): NotificacionMejorada[] => {
    return data
      .filter((n: NotificacionRaw) => !n.mensaje.includes('temporizador'))
      .map((n: NotificacionRaw) => ({
        id: n.id_notificacion ?? n.id ?? 0,
        mensaje: n.mensaje,
        leida: !!n.leida,
        fecha: n.fecha ?? n.fecha_creacion ?? '',
        tipo: n.tipo ?? 'info',
        prioridad: (n.prioridad as 'baja' | 'normal' | 'alta' | 'critica') ?? 'normal',
        entidad: n.entidad,
        entidad_id: n.entidad_id,
        emisor: n.emisor_nombre ? {
          nombre: n.emisor_nombre,
          rol: n.emisor_rol || 'Usuario'
        } : undefined
      }));
  };

  // Función para obtener notificaciones
  const fetchNotificaciones = useCallback(async () => {
    if (!getToken()) {
      console.log('No hay token de autenticación, omitiendo carga de notificaciones');
      setLoading(false);
      return;
    }

    setLoading(true);
    const token = getToken();
    
    try {
      // Intentar primero el endpoint mejorado
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/mejoradas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      let data;
      
      // Si falla el endpoint mejorado, usar el anterior como fallback
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Token inválido o expirado');
          setLoading(false);
          return;
        }
        
        console.log('Endpoint mejorado no disponible, usando fallback...');
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
      }
      
      // Verificar si la respuesta es válida antes de parsear JSON
      if (res.ok) {
        data = await res.json();
      } else {
        if (res.status === 401) {
          console.log('Token inválido o expirado en fallback');
          setLoading(false);
          return;
        }
        console.error('Error en la respuesta del servidor:', res.status, res.statusText);
        setLoading(false);
        return;
      }
      
      const normalizadas = Array.isArray(data) ? normalizarNotificaciones(data) : [];
      
      // Verificar notificaciones nuevas importantes para pagadores
      const nuevasImportantes = normalizadas.filter(n => 
        !n.leida && 
        !prevNotiIds.current.has(n.id) && 
        (n.tipo === 'solicitud_aprobada' || n.tipo === 'viatico_aprobado')
      );

      // Mostrar toasts para pagos pendientes importantes
      if (nuevasImportantes.length > 0) {
        nuevasImportantes.forEach(notificacion => {
          const { tipo, emisor, entidad_id } = notificacion;
          let mensaje = '';
          
          if (tipo === 'solicitud_aprobada') {
            mensaje = `Nueva solicitud APROBADA lista para pago${entidad_id ? ` #${entidad_id}` : ''}`;
          } else if (tipo === 'viatico_aprobado') {
            mensaje = `Nuevo viático APROBADO listo para pago${entidad_id ? ` #${entidad_id}` : ''}`;
          }
          
          if (emisor) {
            mensaje += ` por ${emisor.nombre}`;
          }

          // Toast simple sin JSX
          toast.success(`💸 PAGO PENDIENTE: ${mensaje}`, {
            toastId: `pago-${notificacion.id}`,
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        });
      }

      prevNotiIds.current = new Set(normalizadas.map(n => n.id));
      setNotificaciones(normalizadas);
      
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para marcar notificación como leída
  const marcarComoLeida = useCallback(async (id: number) => {
    const token = getToken();
    if (!token) {
      console.log('No hay token para marcar notificación como leída');
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/${id}/marcar-leida`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        // Actualizar estado local solo si la petición fue exitosa
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      } else {
        console.error('Error al marcar notificación como leída:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }, []);

  // Función para marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.log('No hay token para marcar notificaciones como leídas');
      return;
    }
    
    try {
      const noLeidas = notificaciones.filter(n => !n.leida);
      const promises = noLeidas.map(n =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/${n.id}/marcar-leida`, {
          method: "POST",
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        })
      );
      
      const responses = await Promise.all(promises);
      const exitosas = responses.filter(res => res.ok);
      
      if (exitosas.length > 0) {
        // Actualizar estado local solo para las exitosas
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  }, [notificaciones]);

  // Contadores útiles para el pagador
  const contadores = {
    total: notificaciones.length,
    noLeidas: notificaciones.filter(n => !n.leida).length,
    pendientesPago: notificaciones.filter(n => 
      ['solicitud_aprobada', 'viatico_aprobado'].includes(n.tipo) && !n.leida
    ).length,
    pagosRealizados: notificaciones.filter(n => 
      ['solicitud_pagada', 'viatico_pagado'].includes(n.tipo)
    ).length
  };

  // Filtros específicos para pagadores
  const obtenerNotificacionesFiltradas = useCallback((filtro: 'todas' | 'no_leidas' | 'pendientes_pago' | 'pagos_realizados') => {
    return notificaciones.filter(n => {
      switch (filtro) {
        case 'no_leidas':
          return !n.leida;
        case 'pendientes_pago':
          return ['solicitud_aprobada', 'viatico_aprobado'].includes(n.tipo) && !n.leida;
        case 'pagos_realizados':
          return ['solicitud_pagada', 'viatico_pagado'].includes(n.tipo);
        default:
          return true;
      }
    });
  }, [notificaciones]);

  // Inicializar polling cada 30 segundos
  useEffect(() => {
    fetchNotificaciones();
    
    intervalRef.current = setInterval(fetchNotificaciones, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotificaciones]);

  return {
    notificaciones,
    loading,
    contadores,
    fetchNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    obtenerNotificacionesFiltradas
  };
};
