const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true, required: true },
  contraseña: { type: String, required: true },
  celular: String,
  createdAt: { type: Date, default: Date.now }
});

// Middleware pre-save simplificado
userSchema.pre('save', async function() {
  if (!this.isModified('contraseña')) return;
  
  this.contraseña = await bcrypt.hash(this.contraseña, 10);
});

module.exports = mongoose.model('User', userSchema);