/* ──────────────────────────────────────────────────────────────
   Componente de Notificaciones Mejoradas para Admin
   Sistema mejorado con información específica por rol y acción
   ────────────────────────────────────────────────────────────── */

'use client';

import React, { useState, useEffect, useCallback, useRef, Fragment, createContext, useContext } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Bell, Check, AlertCircle, X, Clock, User, DollarSign, FileText, Building2, Calendar, Tag } from 'lucide-react';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@/contexts/AuthContext';
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

interface AdminNotificationsMejoradasProps {
  open: boolean;
  onClose: () => void;
}

const NotiContext = createContext<{ refreshNotificaciones: () => Promise<void> } | null>(null);

export function useNotiContext() {
  return useContext(NotiContext);
}

// Función para obtener el icono según el tipo de notificación
const getIconoTipo = (tipo: string, prioridad: string) => {
  const iconProps = `w-4 h-4 ${prioridad === 'critica' ? 'text-red-600' : prioridad === 'alta' ? 'text-orange-500' : prioridad === 'normal' ? 'text-blue-500' : 'text-gray-500'}`;
  
  switch (tipo) {
    case 'solicitud_creada':
    case 'solicitud_aprobada':
    case 'solicitud_rechazada':
    case 'solicitud_pagada':
      return <FileText className={iconProps} />;
    case 'viatico_creado':
    case 'viatico_aprobado':
    case 'viatico_rechazado':
      return <Building2 className={iconProps} />;
    case 'usuario_creado':
    case 'usuario_actualizado':
      return <User className={iconProps} />;
    case 'comprobante_subido':
      return <Tag className={iconProps} />;
    case 'lote_aprobado':
    case 'lote_rechazado':
      return <Check className={iconProps} />;
    default:
      return <Bell className={iconProps} />;
  }
};

// Función para obtener el color de fondo según la prioridad
const getColorPrioridad = (prioridad: string, leida: boolean) => {
  if (leida) return 'bg-gray-50';
  
  switch (prioridad) {
    case 'critica':
      return 'bg-red-50 border-l-4 border-red-500';
    case 'alta':
      return 'bg-orange-50 border-l-4 border-orange-500';
    case 'normal':
      return 'bg-blue-50 border-l-4 border-blue-500';
    case 'baja':
      return 'bg-gray-50 border-l-4 border-gray-300';
    default:
      return 'bg-blue-50';
  }
};

// Función para formatear el mensaje de manera más legible
const formatearMensajeMejorado = (mensaje: string, tipo: string, emisor?: { nombre: string; rol: string }) => {
  // Si el mensaje ya viene formateado del backend mejorado, solo aplicar algunos ajustes
  if (mensaje.includes('<strong>') || mensaje.includes('<br>')) {
    return mensaje;
  }
  
  // Fallback para mensajes del sistema anterior
  const tipoIcono = tipo === 'solicitud_creada' ? '📝' : 
                   tipo === 'solicitud_aprobada' ? '✅' :
                   tipo === 'solicitud_rechazada' ? '❌' :
                   tipo === 'solicitud_pagada' ? '💸' :
                   tipo === 'usuario_creado' ? '👤' : '🔔';
  
  if (emisor?.nombre) {
    return `${tipoIcono} <strong>${emisor.nombre}</strong> (${emisor.rol}) realizó una acción en el sistema`;
  }
  
  return `${tipoIcono} ${mensaje}`;
};

// Función para extraer información resumida del mensaje
const extraerResumenNotificacion = (mensaje: string, tipo: string) => {
  const resumen: { titulo: string; descripcion: string; monto?: string; entidad?: string } = {
    titulo: 'Notificación del sistema',
    descripcion: 'Se realizó una acción en el sistema'
  };

  // Extraer monto si existe
  const montoMatch = mensaje.match(/\$[\d,]+/);
  if (montoMatch) {
    resumen.monto = montoMatch[0];
  }

  // Determinar título según tipo
  switch (tipo) {
    case 'solicitud_creada':
      resumen.titulo = 'Nueva solicitud creada';
      resumen.entidad = 'Solicitud';
      break;
    case 'solicitud_aprobada':
      resumen.titulo = 'Solicitud aprobada';
      resumen.entidad = 'Solicitud';
      break;
    case 'solicitud_rechazada':
      resumen.titulo = 'Solicitud rechazada';
      resumen.entidad = 'Solicitud';
      break;
    case 'solicitud_pagada':
      resumen.titulo = 'Pago procesado';
      resumen.entidad = 'Pago';
      break;
    case 'usuario_creado':
      resumen.titulo = 'Nuevo usuario registrado';
      resumen.entidad = 'Usuario';
      break;
    case 'lote_aprobado':
      resumen.titulo = 'Aprobación en lote';
      resumen.entidad = 'Lote';
      break;
    default:
      resumen.titulo = 'Actividad del sistema';
  }

  // Extraer descripción más limpia
  if (mensaje.includes('<br>')) {
    const partes = mensaje.split('<br>');
    resumen.descripcion = partes[0].replace(/<[^>]*>/g, '').substring(0, 100) + '...';
  } else {
    resumen.descripcion = mensaje.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
  }

  return resumen;
};

export default function AdminNotificationsMejoradas({ open, onClose }: AdminNotificationsMejoradasProps) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionMejorada[]>([]);
  const [loading, setLoading] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | 'alta_prioridad'>('todas');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'solicitudes' | 'usuarios' | 'viaticos'>('todos');
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;
  const [loadingMore, setLoadingMore] = useState(false);

  const getToken = () => getAuthToken();
  const prevNotiIds = useRef<Set<number>>(new Set());

  const fetchNotificacionesMejoradas = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones/mejoradas`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      
      const normalizadas: NotificacionMejorada[] = Array.isArray(data)
        ? data
            .filter((n: NotificacionRaw) => !n.mensaje.includes('temporizador'))
            .map((n: NotificacionRaw) => ({
              id: n.id_notificacion ?? n.id ?? 0,
              mensaje: n.mensaje,
              tipo: n.tipo || 'info',
              prioridad: (n.prioridad as any) || 'normal',
              entidad: n.entidad,
              entidad_id: n.entidad_id,
              leida: !!n.leida,
              fecha: n.fecha ?? n.fecha_creacion ?? '',
              emisor: n.emisor_nombre ? {
                nombre: n.emisor_nombre,
                rol: n.emisor_rol || 'Usuario'
              } : undefined
            }))
        : [];

      // Mostrar toast para notificaciones nuevas de alta prioridad
      const nuevasImportantes = normalizadas.filter(n => 
        !n.leida && 
        !prevNotiIds.current.has(n.id) && 
        (n.prioridad === 'alta' || n.prioridad === 'critica')
      );

      if (nuevasImportantes.length > 0) {
        const ultimaImportante = nuevasImportantes[0];
        const resumen = extraerResumenNotificacion(ultimaImportante.mensaje, ultimaImportante.tipo);
        
        toast(
          <div className="flex items-center gap-3">
            <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${ultimaImportante.prioridad === 'critica' ? 'bg-red-500' : 'bg-orange-500'} shadow-lg`}>
              {getIconoTipo(ultimaImportante.tipo, ultimaImportante.prioridad)}
            </span>
            <div className="flex-1 min-w-0">
              <h6 className={`font-semibold text-base mb-0.5 ${ultimaImportante.prioridad === 'critica' ? 'text-red-700' : 'text-orange-700'}`}>
                {ultimaImportante.prioridad === 'critica' ? '🚨 URGENTE' : '⚠️ IMPORTANTE'}
              </h6>
              <p className="text-gray-700 text-sm leading-snug">{resumen.titulo}</p>
              {resumen.monto && <p className="text-xs text-gray-600 font-medium">{resumen.monto}</p>}
            </div>
          </div>,
          {
            toastId: `noti-${ultimaImportante.id}`,
            position: "top-right",
            autoClose: ultimaImportante.prioridad === 'critica' ? 10000 : 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            className: `!bg-white !shadow-xl !border !rounded-2xl !p-4 ${ultimaImportante.prioridad === 'critica' ? '!shadow-red-500/20 !border-red-200' : '!shadow-orange-500/20 !border-orange-200'}`
          }
        );
      }

      prevNotiIds.current = new Set(normalizadas.map(n => n.id));
      setNotificaciones(normalizadas);
    } catch (error) {
      console.error('Error fetching notificaciones mejoradas:', error);
      // Fallback al endpoint anterior
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        const normalizadas = Array.isArray(data) ? data.map((n: any) => ({
          id: n.id_notificacion ?? n.id ?? 0,
          mensaje: n.mensaje,
          tipo: 'info',
          prioridad: 'normal' as const,
          leida: !!n.leida,
          fecha: n.fecha ?? n.fecha_creacion ?? ''
        })) : [];
        setNotificaciones(normalizadas);
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    fetchNotificacionesMejoradas();
  }, [open, user, fetchNotificacionesMejoradas]);

  const handleMarcarTodas = async () => {
    setMarcandoTodas(true);
    const token = getToken();
    try {
      const noLeidas = notificaciones.filter(n => !n.leida);
      await Promise.all(noLeidas.map(n =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones/${n.id}/marcar-leida`, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        })
      ));
      await fetchNotificacionesMejoradas();
    } finally {
      setMarcandoTodas(false);
    }
  };

  // Filtros aplicados
  const notificacionesFiltradas = notificaciones.filter(n => {
    // Filtro por estado
    if (filtro === 'no_leidas' && n.leida) return false;
    if (filtro === 'alta_prioridad' && !['alta', 'critica'].includes(n.prioridad)) return false;
    
    // Filtro por tipo
    if (filtroTipo === 'solicitudes' && !n.tipo.includes('solicitud')) return false;
    if (filtroTipo === 'usuarios' && !n.tipo.includes('usuario')) return false;
    if (filtroTipo === 'viaticos' && !n.tipo.includes('viatico')) return false;
    
    return true;
  });

  // Ordenar por prioridad y fecha
  const notificacionesOrdenadas = [...notificacionesFiltradas].sort((a, b) => {
    // Primero por estado (no leídas primero)
    if (a.leida !== b.leida) return a.leida ? 1 : -1;
    
    // Luego por prioridad
    const prioridadOrder = { critica: 0, alta: 1, normal: 2, baja: 3 };
    const prioA = prioridadOrder[a.prioridad] ?? 4;
    const prioB = prioridadOrder[b.prioridad] ?? 4;
    if (prioA !== prioB) return prioA - prioB;
    
    // Finalmente por fecha (más recientes primero)
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  const notificacionesPaginadas = notificacionesOrdenadas.slice(0, pagina * porPagina);
  const contadores = {
    total: notificaciones.length,
    noLeidas: notificaciones.filter(n => !n.leida).length,
    altaPrioridad: notificaciones.filter(n => ['alta', 'critica'].includes(n.prioridad)).length
  };

  return (
    <NotiContext.Provider value={{ refreshNotificaciones: fetchNotificacionesMejoradas }}>
      <ToastContainer
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        theme="light"
        className="!z-[9999]"
      />
      
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-[60] flex items-start justify-end p-4 sm:p-6 lg:p-8">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-blue-100 flex flex-col max-h-[90vh]">
                
                {/* Header con gradiente mejorado */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-6 h-6 text-white" />
                      <Dialog.Title className="text-lg font-bold text-white">
                        Notificaciones del Sistema
                      </Dialog.Title>
                    </div>
                    <div className="flex items-center gap-2">
                      {contadores.altaPrioridad > 0 && (
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-100 rounded-full text-xs font-medium backdrop-blur-sm border border-red-400/30">
                          {contadores.altaPrioridad} urgentes
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                        {contadores.noLeidas} nuevas
                      </span>
                    </div>
                  </div>

                  {/* Filtros mejorados */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'todas' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        onClick={() => setFiltro('todas')}
                      >Todas</button>
                      <button
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'no_leidas' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        onClick={() => setFiltro('no_leidas')}
                      >No leídas</button>
                      <button
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'alta_prioridad' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        onClick={() => setFiltro('alta_prioridad')}
                      >Prioritarias</button>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filtroTipo === 'todos' ? 'bg-white text-blue-600' : 'bg-white/15 text-white/80 hover:bg-white/25'}`}
                        onClick={() => setFiltroTipo('todos')}
                      >Todos</button>
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filtroTipo === 'solicitudes' ? 'bg-white text-blue-600' : 'bg-white/15 text-white/80 hover:bg-white/25'}`}
                        onClick={() => setFiltroTipo('solicitudes')}
                      >Solicitudes</button>
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filtroTipo === 'usuarios' ? 'bg-white text-blue-600' : 'bg-white/15 text-white/80 hover:bg-white/25'}`}
                        onClick={() => setFiltroTipo('usuarios')}
                      >Usuarios</button>
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filtroTipo === 'viaticos' ? 'bg-white text-blue-600' : 'bg-white/15 text-white/80 hover:bg-white/25'}`}
                        onClick={() => setFiltroTipo('viaticos')}
                      >Viáticos</button>
                      
                      {contadores.noLeidas > 0 && (
                        <button
                          className={`ml-auto px-3 py-1 rounded-md text-xs font-medium transition-all bg-white/15 text-white/80 hover:bg-white/25 ${marcandoTodas ? 'opacity-60 pointer-events-none' : ''}`}
                          onClick={handleMarcarTodas}
                          disabled={marcandoTodas}
                        >
                          {marcandoTodas ? 'Marcando...' : 'Marcar todas'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de notificaciones */}
                {loading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando notificaciones...
                    </div>
                  </div>
                ) : notificacionesPaginadas.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                    <Bell className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-center font-medium">
                      No hay notificaciones {filtro === 'no_leidas' ? 'sin leer' : filtro === 'alta_prioridad' ? 'prioritarias' : ''}.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {notificacionesPaginadas.map((n) => {
                      const fechaObj = n.fecha ? new Date(n.fecha) : null;
                      const fechaStr = fechaObj && !isNaN(fechaObj.getTime())
                        ? fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '';
                      
                      const resumen = extraerResumenNotificacion(n.mensaje, n.tipo);
                      
                      return (
                        <div
                          key={n.id}
                          className={`p-4 transition-all duration-200 hover:bg-gray-50 ${getColorPrioridad(n.prioridad, n.leida)}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                              !n.leida 
                                ? n.prioridad === 'critica' 
                                  ? 'bg-red-100 text-red-600' 
                                  : n.prioridad === 'alta' 
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {getIconoTipo(n.tipo, n.prioridad)}
                              {!n.leida && (
                                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                                  n.prioridad === 'critica' ? 'bg-red-500' :
                                  n.prioridad === 'alta' ? 'bg-orange-500' : 'bg-blue-500'
                                }`} />
                              )}
                            </span>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-sm mb-1 ${!n.leida ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {resumen.titulo}
                                    {resumen.monto && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        <DollarSign className="w-3 h-3 mr-1" />
                                        {resumen.monto}
                                      </span>
                                    )}
                                  </h4>
                                  
                                  <div 
                                    className={`text-sm ${!n.leida ? 'text-gray-800' : 'text-gray-600'} line-clamp-3`}
                                    dangerouslySetInnerHTML={{ __html: formatearMensajeMejorado(n.mensaje, n.tipo, n.emisor) }}
                                  />
                                  
                                  <div className="flex items-center gap-4 mt-2">
                                    {n.emisor && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {n.emisor.nombre}
                                      </span>
                                    )}
                                    
                                    {fechaStr && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {fechaStr}
                                      </span>
                                    )}
                                    
                                    {n.entidad && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {n.entidad}
                                        {n.entidad_id && ` #${n.entidad_id}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-1">
                                  {n.prioridad === 'critica' && (
                                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                      URGENTE
                                    </span>
                                  )}
                                  {n.prioridad === 'alta' && (
                                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                      IMPORTANTE
                                    </span>
                                  )}
                                  
                                  {!n.leida && (
                                    <button
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                      onClick={async () => {
                                        const token = getToken();
                                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones/${n.id}/marcar-leida`, {
                                          method: "POST",
                                          headers: { Authorization: token ? `Bearer ${token}` : '' }
                                        });
                                        await fetchNotificacionesMejoradas();
                                      }}
                                    >
                                      Marcar leída
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Botón cargar más */}
                    {notificacionesFiltradas.length > notificacionesPaginadas.length && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <button
                          className="w-full px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-all flex items-center justify-center gap-2"
                          onClick={() => setPagina(p => p + 1)}
                        >
                          Cargar más notificaciones ({notificacionesFiltradas.length - notificacionesPaginadas.length} restantes)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </NotiContext.Provider>
  );
}
