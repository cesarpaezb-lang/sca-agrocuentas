// src/routes/Transaccion.js
const express = require('express');
const Transaccion = require('../models/Transaccion');
const Proyecto = require('../models/Proyecto');
const AlertaService = require('../services/alertaService');

const router = express.Router();

const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const jwt = require('jsonwebtoken');
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Función auxiliar para calcular totales
async function calcularTotales(proyectoId) {
  const transacciones = await Transaccion.find({ proyecto: proyectoId });
  const costos = transacciones.filter(t => t.tipo === 'costo').reduce((s, t) => s + t.total, 0);
  const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.total, 0);
  const ventas = transacciones.filter(t => t.tipo === 'venta').reduce((s, t) => s + t.total, 0);
  return { costos, gastos, ventas };
}

// Crear transacción CON ALERTAS PUB/SUB
router.post('/', verificarToken, async (req, res) => {
  try {
    const { proyecto, tipo, descripcion, cantidad, valorUnitario } = req.body;
    const proj = await Proyecto.findById(proyecto);
    if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });
    
    const total = cantidad * valorUnitario;
    const transaccion = new Transaccion({
      proyecto, tipo, descripcion, cantidad, valorUnitario, total
    });
    await transaccion.save();

    // ===== INICIO SISTEMA PUB/SUB =====
    // Calcular totales actualizados
    const totales = await calcularTotales(proyecto);
    const hayPerdida = (totales.costos + totales.gastos) > totales.ventas && totales.ventas > 0;
    
    let alerta = null;
    
    // Solo alertar si hay pérdida y tenemos io disponible
    if (hayPerdida && req.io) {
      const alertaService = AlertaService(req.io);
      alerta = await alertaService.verificarYNotificar(proyecto, {
        costos: totales.costos,
        gastos: totales.gastos,
        ventas: totales.ventas,
        usuarioId: req.usuario.id || req.usuario._id
      });
    }
    // ===== FIN SISTEMA PUB/SUB =====

    res.json({
      success: true,
      transaccion,
      totales,
      alerta: alerta || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener transacciones por proyecto
router.get('/proyecto/:proyectoId', verificarToken, async (req, res) => {
  try {
    const transacciones = await Transaccion.find({ proyecto: req.params.proyectoId });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Informe de ganancias/pérdidas
router.get('/informe/:proyectoId', verificarToken, async (req, res) => {
  try {
    const transacciones = await Transaccion.find({ proyecto: req.params.proyectoId });
    const costos = transacciones.filter(t => t.tipo === 'costo').reduce((s, t) => s + t.total, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.total, 0);
    const ventas = transacciones.filter(t => t.tipo === 'venta').reduce((s, t) => s + t.total, 0);
    const totalInversión = costos + gastos;
    const ganancia = ventas - totalInversión;
    const margenRentabilidad = totalInversión > 0 ? (ganancia / totalInversión) * 100 : 0;
    res.json({
      costos, gastos, ventas, totalInversión, ganancia, margenRentabilidad,
      rentable: ganancia > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar transacción
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { descripcion, cantidad, valorUnitario } = req.body;
    const total = cantidad * valorUnitario;
    
    const transaccion = await Transaccion.findByIdAndUpdate(
      req.params.id,
      { descripcion, cantidad, valorUnitario, total },
      { new: true }
    );
    
    if (!transaccion) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json(transaccion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar transacción
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const transaccion = await Transaccion.findByIdAndDelete(req.params.id);
    if (!transaccion) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json({ mensaje: 'Transacción eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;