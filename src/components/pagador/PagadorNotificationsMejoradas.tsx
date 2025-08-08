'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotificacionesPagador } from '@/hooks/useNotificacionesPagador';

interface PagadorNotificationsMejoradasProps {
  open: boolean;
  onClose: () => void;
}

type FiltroNotificaciones = 'todas' | 'no_leidas';

export default function PagadorNotificationsMejoradas({ open, onClose }: PagadorNotificationsMejoradasProps) {
  const { 
    notificaciones, 
    loading, 
    marcarComoLeida, 
    marcarTodasComoLeidas,
    contadores 
  } = useNotificacionesPagador();

  const [filtro, setFiltro] = useState<FiltroNotificaciones>('todas');

  // Filtrar notificaciones según el filtro seleccionado
  const notificacionesFiltradas = notificaciones.filter(notif => {
    switch(filtro) {
      case 'no_leidas':
        return !notif.leida;
      default:
        return true;
    }
  });

  // Función para formatear mensaje de forma profesional y clara
  const formatearMensaje = (mensaje: string): string => {
    // Remover símbolos especiales al inicio
    let mensajeLimpio = mensaje.replace(/^[^\w\s]+\s*/, '');
    
    // Patrones específicos para pagador
    let match;
    
    // 1. Solicitud aprobada/autorizada
    match = mensajeLimpio.match(/solicitud\s+(?:aprobada|autorizada).*\$([0-9,]+\.?\d*)/i);
    if (match) {
      const monto = match[1];
      const conceptoMatch = mensajeLimpio.match(/([A-Z\s]+)\s*\(/);
      const concepto = conceptoMatch ? conceptoMatch[1].trim() : '';
      const solicitanteMatch = mensajeLimpio.match(/Solicitante:\s*([^)]+)/);
      const solicitante = solicitanteMatch ? solicitanteMatch[1].trim() : '';
      
      return `Solicitud autorizada: $${monto}${concepto ? ` - ${concepto}` : ''}${solicitante ? ` (${solicitante})` : ''}`;
    }
    
    // 2. Viático aprobado
    match = mensajeLimpio.match(/vi[aá]tico\s+aprobado.*\$([0-9,]+\.?\d*)/i);
    if (match) {
      const monto = match[1];
      return `Viático aprobado: $${monto}`;
    }
    
    // 3. Solicitud pagada
    match = mensajeLimpio.match(/solicitud\s+pagada.*\$([0-9,]+\.?\d*)/i);
    if (match) {
      const monto = match[1];
      return `Pago procesado: $${monto}`;
    }
    
    // 4. Genéricos
    if (/solicitud.*aprobada|solicitud.*autorizada/i.test(mensajeLimpio)) {
      return 'Solicitud lista para pago';
    }
    
    if (/vi[aá]tico.*aprobado/i.test(mensajeLimpio)) {
      return 'Viático listo para pago';
    }
    
    if (/solicitud.*pagada/i.test(mensajeLimpio)) {
      return 'Pago procesado exitosamente';
    }
    
    // Limpiar y devolver mensaje original sin símbolos extraños
    return mensajeLimpio || 'Notificación';
  };

  // Función para obtener el icono según el tipo de notificación
  const getIconoTipo = (tipo: string | undefined) => {
    switch(tipo) {
      case 'solicitud_aprobada':
      case 'viatico_aprobado':
        return <CheckCircle className="w-4 h-4" />;
      case 'solicitud_creada':
      case 'viatico_creado':
        return <Clock className="w-4 h-4" />;
      case 'solicitud_rechazada':
      case 'viatico_rechazado':
        return <X className="w-4 h-4" />;
      case 'solicitud_pagada':
      case 'viatico_pagado':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
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
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-blue-100 flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-white" />
                    <Dialog.Title className="text-lg font-bold text-white">Notificaciones</Dialog.Title>
                  </div>
                  <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                    {contadores.noLeidas} nuevas
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'todas' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    onClick={() => setFiltro('todas')}
                  >Todas</button>
                  <button
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'no_leidas' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    onClick={() => setFiltro('no_leidas')}
                  >No leídas</button>
                  {contadores.noLeidas > 0 && (
                    <button
                      className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-white/20 text-white hover:bg-white/30"
                      onClick={marcarTodasComoLeidas}
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
              </div>

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
              ) : notificacionesFiltradas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                  <Bell className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-center font-medium">No hay notificaciones {filtro === 'no_leidas' ? 'sin leer' : ''}.</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-y-auto max-h-[60vh] divide-y divide-gray-100">
                    {notificacionesFiltradas.map((notificacion) => {
                      const fechaObj = notificacion.fecha ? new Date(notificacion.fecha) : null;
                      const fechaStr = fechaObj && !isNaN(fechaObj.getTime())
                        ? fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '';
                      const horaStr = fechaObj && !isNaN(fechaObj.getTime())
                        ? fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      
                      const handleMarcarLeida = async () => {
                        await marcarComoLeida(notificacion.id);
                      };

                      return (
                        <div
                          key={notificacion.id}
                          className={`p-4 transition-all duration-200 hover:bg-gray-50 ${notificacion.leida ? '' : 'bg-blue-50/50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notificacion.leida ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                              {getIconoTipo(notificacion.tipo)}
                              {!notificacion.leida && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notificacion.leida ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                                {formatearMensaje(notificacion.mensaje)}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>{fechaStr}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{horaStr}</span>
                              </div>
                            </div>
                            {!notificacion.leida && (
                              <button
                                onClick={handleMarcarLeida}
                                className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                                title="Marcar como leída"
                              >
                                Marcar como leída
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
