const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  proyecto: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Proyecto' 
  },
  tipo: { 
    type: String, 
    enum: ['PERDIDA_CRITICA', 'MARGEN_BAJO', 'EQUILIBRIO_CRITICO'], 
    required: true 
  },
  titulo: String,
  mensaje: String,
  severidad: { 
    type: String, 
    enum: ['baja', 'media', 'alta'], 
    default: 'media' 
  },
  leida: { 
    type: Boolean, 
    default: false 
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notificacion', notificacionSchema);