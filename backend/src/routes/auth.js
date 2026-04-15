const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();  // <-- Esta línea faltaba

// Registro
router.post('/register', async (req, res, next) => {
  try {
    const { nombre, email, contraseña, celular } = req.body;
    
    console.log('Datos recibidos:', { nombre, email, celular });
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'Usuario ya existe' });
    
    user = new User({ nombre, email, contraseña, celular });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, usuario: { id: user._id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.log('ERROR EN REGISTRO:', error.message);
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, contraseña } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });
    
    const esValida = await bcrypt.compare(contraseña, user.contraseña);
    if (!esValida) return res.status(400).json({ error: 'Credenciales inválidas' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, usuario: { id: user._id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;