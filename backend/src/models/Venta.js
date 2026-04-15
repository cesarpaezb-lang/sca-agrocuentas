// src/models/Venta.js
const mongoose = require('mongoose');

const VentaSchema = new mongoose.Schema({
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  valorUnitario: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

// Middleware para calcular total antes de guardar
VentaSchema.pre('save', function(next) {
  this.total = this.cantidad * this.valorUnitario;
  next();
});

module.exports = mongoose.model('Venta', VentaSchema);