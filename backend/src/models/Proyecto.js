const mongoose = require('mongoose');

const proyectoSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  nombre: { 
    type: String, 
    required: true 
  },
  // CAMBIO IMPORTANTE: Array de socios en lugar de String simple
  socios: [{
    nombre: { type: String, required: true },
    aporte: { type: Number, default: 0 }
  }],
  inicio: Date,
  modalidad: String,
  estado: { 
    type: String, 
    default: 'activo', 
    enum: ['activo', 'finalizado'] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Virtual para calcular inversión total (no se guarda en DB, se calcula al consultar)
proyectoSchema.virtual('inversionTotal').get(function() {
  return this.socios.reduce((total, socio) => total + (socio.aporte || 0), 0);
});

// Asegurar que los virtuales se incluyan en JSON
proyectoSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Proyecto', proyectoSchema);