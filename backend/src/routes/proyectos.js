const express = require('express');
const Proyecto = require('../models/Proyecto');
const Transaccion = require('../models/Transaccion');

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

// Crear proyecto
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, socio, inicio, modalidad } = req.body;
    const proyecto = new Proyecto({
      usuario: req.usuario.id,
      nombre, socio, inicio, modalidad
    });
    await proyecto.save();
    res.json(proyecto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar proyectos
router.get('/', verificarToken, async (req, res) => {
  try {
    const proyectos = await Proyecto.find({ usuario: req.usuario.id });
    res.json(proyectos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener proyecto por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(proyecto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar proyecto
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { nombre, socio, modalidad } = req.body;
    const proyecto = await Proyecto.findByIdAndUpdate(
      req.params.id,
      { nombre, socio, modalidad, updatedAt: Date.now() },
      { new: true }
    );
    res.json(proyecto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar proyecto
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await Proyecto.findByIdAndDelete(req.params.id);
    await Transaccion.deleteMany({ proyecto: req.params.id });
    res.json({ mensaje: 'Proyecto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
