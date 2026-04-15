const mongoose = require('mongoose');

const proyectoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nombre: { type: String, required: true },
  socio: String,
  inicio: Date,
  modalidad: String,
  estado: { type: String, default: 'activo', enum: ['activo', 'finalizado'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proyecto', proyectoSchema);