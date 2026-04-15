import React from 'react';
import './AlertaToast.css';

const AlertaToast = ({ alerta, onClose }) => {
  const colores = { alta: '#e74c3c', media: '#f39c12', baja: '#3498db' };
  const iconos = {
    PERDIDA_CRITICA: '⚠️',
    MARGEN_BAJO: '⚡',
    EQUILIBRIO_CRITICO: '📊'
  };

  return (
    <div className="alerta-toast" style={{ borderLeft: `5px solid ${colores[alerta.severidad]}` }}>
      <div className="alerta-header">
        <span>{iconos[alerta.tipo] || '🔔'}</span>
        <h4>{alerta.titulo}</h4>
        <button onClick={onClose}>×</button>
      </div>
      <p>{alerta.mensaje}</p>
    </div>
  );
};

export default AlertaToast;