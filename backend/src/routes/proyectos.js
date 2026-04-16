const express = require('express');
const router = express.Router();
const Proyecto = require('../models/Proyecto');
const jwt = require('jsonwebtoken');

// Middleware de verificación (si no lo tienes en archivo separado)
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Crear proyecto con múltiples socios
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, socios, inicio, modalidad } = req.body;
    
    // Validar que socios sea un array
    if (!Array.isArray(socios) || socios.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un socio' });
    }

    const proyecto = new Proyecto({
      usuario: req.usuario.id || req.usuario._id,
      nombre,
      socios: socios.map(s => ({
        nombre: s.nombre,
        aporte: parseFloat(s.aporte) || 0
      })),
      inicio,
      modalidad,
      estado: 'activo'
    });

    await proyecto.save();
    
    // Calcular inversión total para devolverla
    const inversionTotal = proyecto.socios.reduce((sum, s) => sum + s.aporte, 0);
    
    res.status(201).json({
      ...proyecto.toJSON(),
      inversionTotal
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los proyectos del usuario
router.get('/', verificarToken, async (req, res) => {
  try {
    const proyectos = await Proyecto.find({ 
      usuario: req.usuario.id || req.usuario._id 
    }).sort({ createdAt: -1 });
    
    res.json(proyectos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un proyecto específico
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const proyecto = await Proyecto.findOne({
      _id: req.params.id,
      usuario: req.usuario.id || req.usuario._id
    });
    
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    res.json(proyecto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar proyecto (opcional, por si necesitas editar socios después)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { nombre, socios, inicio, modalidad, estado } = req.body;
    
    const updateData = {
      nombre,
      inicio,
      modalidad,
      estado,
      updatedAt: Date.now()
    };
    
    // Solo actualizar socios si se envían
    if (socios && Array.isArray(socios)) {
      updateData.socios = socios.map(s => ({
        nombre: s.nombre,
        aporte: parseFloat(s.aporte) || 0
      }));
    }
    
    const proyecto = await Proyecto.findOneAndUpdate(
      { 
        _id: req.params.id, 
        usuario: req.usuario.id || req.usuario._id 
      },
      updateData,
      { new: true }
    );
    
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    res.json(proyecto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar proyecto
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const proyecto = await Proyecto.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario.id || req.usuario._id
    });
    
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    res.json({ mensaje: 'Proyecto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;