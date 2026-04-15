/**
 * Servicio PUB/SUB para alertas de estados críticos
 * Publish/Subscribe pattern implementado con Socket.IO
 */

class AlertaService {
  constructor(io) {
    this.io = io;
  }

  /**
   * PUBLICADOR: Verifica estados críticos y publica alertas
   * @param {String} proyectoId - ID del proyecto agrícola
   * @param {Object} datos - {costos, gastos, ventas, usuarioId}
   */
  async verificarYNotificar(proyectoId, datos) {
    const { costos = 0, gastos = 0, ventas = 0, usuarioId } = datos;
    
    const totalEgresos = Number(costos) + Number(gastos);
    const margen = ventas - totalEgresos;
    const rentabilidad = ventas > 0 ? (margen / ventas) * 100 : 0;
    
    let alerta = null;

    // Lógica de negocio: Detectar estados críticos
    if (rentabilidad < 0) {
      alerta = {
        tipo: 'PERDIDA_CRITICA',
        titulo: '⚠️ Pérdida Proyectada',
        mensaje: `Su proyecto está generando una pérdida del ${Math.abs(rentabilidad).toFixed(1)}% ($${Math.abs(margen).toLocaleString()}). Revise inmediatamente sus gastos operativos.`,
        severidad: 'alta',
        timestamp: new Date(),
        proyectoId
      };
    } 
    else if (rentabilidad < 10 && ventas > 0) {
      alerta = {
        tipo: 'MARGEN_BAJO',
        titulo: '⚡ Rentabilidad Baja',
        mensaje: `Su margen de ganancia es del ${rentabilidad.toFixed(1)}%, muy cercano al punto de equilibrio.`,
        severidad: 'media',
        timestamp: new Date(),
        proyectoId
      };
    }
    else if (totalEgresos > (ventas * 0.8) && ventas > 0) {
      alerta = {
        tipo: 'EQUILIBRIO_CRITICO',
        titulo: '📊 Punto de Equilibrio Cercano',
        mensaje: `Sus costos representan el ${((totalEgresos/ventas)*100).toFixed(0)}% de sus ingresos. Cualquier gasto adicional puede generar pérdidas.`,
        severidad: 'media',
        timestamp: new Date(),
        proyectoId
      };
    }

    // Si hay alerta, publicarla
    if (alerta && usuarioId) {
      await this.publicarAlerta(usuarioId, alerta);
      await this.guardarEnBD(usuarioId, alerta);
    }

    return alerta;
  }

  /**
   * PUB: Publica la alerta al canal específico del usuario
   * @param {String} userId - ID del usuario (subscriptor)
   * @param {Object} alerta - Datos de la alerta
   */
  publicarAlerta(userId, alerta) {
    const canal = `user_${userId}`;
    
    // Emitir al room específico (patrón PUB/SUB)
    this.io.to(canal).emit('nueva_alerta', alerta);
    
    console.log(`📤 Alerta PUBLICADA en canal ${canal}:`, alerta.tipo);
  }

  /**
   * Guardar notificación en MongoDB para historial persistente
   */
  async guardarEnBD(userId, alerta) {
    try {
      const Notificacion = require('../models/Notificacion');
      await Notificacion.create({
        usuario: userId,
        ...alerta,
        leida: false,
        fechaCreacion: new Date()
      });
    } catch (error) {
      console.error('Error guardando notificación:', error);
    }
  }
}

// Exportar singleton
let instancia = null;

module.exports = (io) => {
  if (!instancia) {
    instancia = new AlertaService(io);
  }
  return instancia;
};