import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export const useAlertas = (userId) => {
  const [alertas, setAlertas] = useState([]);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io('http://192.168.1.7:5001', {
      transports: ['websocket'],
      reconnection: true
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Conectado a alertas SCA');
      setConectado(true);
      socketInstance.emit('registrar_usuario', userId);
    });

    socketInstance.on('nueva_alerta', (alerta) => {
      console.log('🔔 Alerta recibida:', alerta);
      setAlertas(prev => [alerta, ...prev]);
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(alerta.titulo, { 
          body: alerta.mensaje,
          icon: '/logo192.png'
        });
      }
    });

    socketInstance.on('registro_exitoso', (data) => {
      console.log('✅', data.mensaje);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔴 Desconectado del sistema de alertas');
      setConectado(false);
    });

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.log('Permiso de notificación denegado');
      });
    }

    return () => socketInstance.disconnect();
  }, [userId]);

  const marcarLeida = useCallback((index) => {
    setAlertas(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { alertas, conectado, marcarLeida };
};