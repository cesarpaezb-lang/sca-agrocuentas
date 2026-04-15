const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Proyecto', required: true },
  tipo: { type: String, enum: ['costo', 'gasto', 'venta'], required: true },
  descripcion: String,
  cantidad: Number,
  valorUnitario: Number,
  total: Number,
  fecha: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaccion', transaccionSchema);
