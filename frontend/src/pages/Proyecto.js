import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Edit2, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import './Proyecto.css';

function Proyecto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [proyecto, setProyecto] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [informe, setInforme] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('costos');
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState({
    tipo: 'costo',
    descripcion: '',
    cantidad: '',
    valorUnitario: ''
  });
  
  // Estados para edición
  const [editandoTransaccion, setEditandoTransaccion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    try {
      setCargando(true);
      const proyRes = await api.get(`/proyectos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProyecto(proyRes.data);
      
      const transRes = await api.get(`/transacciones/proyecto/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransacciones(transRes.data);
      
      const infRes = await api.get(`/transacciones/informe/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInforme(infRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos del proyecto');
    } finally {
      setCargando(false);
    }
  }, [id, token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarAgregarTransaccion = async (e) => {
    e.preventDefault();
    try {
      if (editandoTransaccion) {
        // Editar existente
        await api.put(`/transacciones/${editandoTransaccion._id}`, {
          descripcion: formulario.descripcion,
          cantidad: parseFloat(formulario.cantidad),
          valorUnitario: parseFloat(formulario.valorUnitario)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Crear nueva
        await api.post('/transacciones', {
          proyecto: id,
          tipo: formulario.tipo,
          descripcion: formulario.descripcion,
          cantidad: parseFloat(formulario.cantidad),
          valorUnitario: parseFloat(formulario.valorUnitario)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetFormulario();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      alert('Error al guardar la transacción');
    }
  };

  const resetFormulario = () => {
    setFormulario({ tipo: 'costo', descripcion: '', cantidad: '', valorUnitario: '' });
    setEditandoTransaccion(null);
    setMostrarModal(false);
  };

  const iniciarEdicion = (transaccion) => {
    setEditandoTransaccion(transaccion);
    setFormulario({
      tipo: transaccion.tipo,
      descripcion: transaccion.descripcion,
      cantidad: transaccion.cantidad.toString(),
      valorUnitario: transaccion.valorUnitario.toString()
    });
    setMostrarModal(true);
  };

  const eliminarTransaccion = async (transaccionId) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        await api.delete(`/transacciones/${transaccionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la transacción');
      }
    }
  };

  // Calcular totales y control de presupuesto
  const calcularInversionTotal = () => {
    return proyecto?.socios?.reduce((sum, s) => sum + (s.aporte || 0), 0) || 0;
  };

  const calcularGastosTotales = () => {
    return transacciones
      .filter(t => t.tipo === 'costo' || t.tipo === 'gasto')
      .reduce((sum, t) => sum + t.total, 0);
  };

  const inversionTotal = calcularInversionTotal();
  const gastosTotales = calcularGastosTotales();
  const presupuestoRestante = inversionTotal - gastosTotales;
  const presupuestoExcedido = presupuestoRestante < 0;
  const porcentajeUsado = inversionTotal > 0 ? (gastosTotales / inversionTotal) * 100 : 0;

  if (cargando) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!proyecto) {
    return <div className="alert alert-danger m-5">Proyecto no encontrado</div>;
  }

  const transaccionesActuales = transacciones.filter(t => t.tipo === pestañaActiva);

  return (
    <div className="proyecto-container">
      {/* Header Mejorado */}
      <div className="bg-success text-white p-4 mb-4">
        <div className="container">
          <button 
            className="btn btn-light btn-sm mb-3 d-flex align-items-center gap-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <h1 className="h2 mb-2">{proyecto.nombre}</h1>
          <div className="row text-success-100">
            <div className="col-md-6">
              <p className="mb-1">
                <strong>Socios:</strong> {proyecto.socios?.map(s => `${s.nombre} ($${s.aporte?.toLocaleString()})`).join(', ') || 'N/A'}
              </p>
              <p className="mb-0">
                <strong>Inversión Total:</strong> ${inversionTotal.toLocaleString()} | 
                <strong> Modalidad:</strong> {proyecto.modalidad || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        {/* Alerta de Presupuesto */}
        {presupuestoExcedido && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <AlertCircle size={20} />
            <div>
              <strong>¡Atención!</strong> Has excedido el presupuesto inicial. 
              Excedente: ${Math.abs(presupuestoRestante).toLocaleString()}
            </div>
          </div>
        )}

        {/* Barra de Progreso del Presupuesto */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h6 className="card-title d-flex justify-content-between">
              <span>Control de Presupuesto</span>
              <span className={presupuestoExcedido ? 'text-danger' : 'text-success'}>
                {porcentajeUsado.toFixed(1)}% usado
              </span>
            </h6>
            <div className="progress mb-2" style={{height: '25px'}}>
              <div 
                className={`progress-bar ${presupuestoExcedido ? 'bg-danger' : 'bg-success'}`}
                role="progressbar"
                style={{width: `${Math.min(porcentajeUsado, 100)}%`}}
              >
                ${gastosTotales.toLocaleString()}
              </div>
            </div>
            <div className="d-flex justify-content-between text-muted small">
              <span>Gastado: ${gastosTotales.toLocaleString()}</span>
              <span>Presupuesto: ${inversionTotal.toLocaleString()}</span>
              <span className={presupuestoRestante < 0 ? 'text-danger fw-bold' : ''}>
                Restante: ${presupuestoRestante.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cards de Resumen Financiero */}
        {informe && (
          <div className="row mb-4 g-3">
            <div className="col-6 col-md-3">
              <div className="card text-center h-100 border-danger">
                <div className="card-body">
                  <h6 className="text-muted small text-uppercase">Costos</h6>
                  <h3 className="text-danger mb-0">${informe.costos?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center h-100 border-warning">
                <div className="card-body">
                  <h6 className="text-muted small text-uppercase">Gastos</h6>
                  <h3 className="text-warning mb-0">${informe.gastos?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center h-100 border-info">
                <div className="card-body">
                  <h6 className="text-muted small text-uppercase">Ventas</h6>
                  <h3 className="text-info mb-0">${informe.ventas?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className={`card text-center h-100 ${informe.ganancia >= 0 ? 'border-success' : 'border-danger'}`}>
                <div className="card-body">
                  <h6 className="text-muted small text-uppercase">Ganancia/Pérdida</h6>
                  <h3 className={`mb-0 ${informe.ganancia >= 0 ? 'text-success' : 'text-danger'}`}>
                    ${informe.ganancia?.toLocaleString() || 0}
                  </h3>
                  {informe.ventas > 0 && (
                    <small className="text-muted">
                      Margen: {((informe.ganancia / informe.ventas) * 100).toFixed(1)}%
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón Nueva Transacción */}
        <button 
          className="btn btn-success btn-lg w-100 mb-4"
          onClick={() => {
            resetFormulario();
            setMostrarModal(true);
          }}
        >
          ➕ Registrar Transacción
        </button>

        {/* Modal de Transacción */}
        {mostrarModal && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className={`modal-header ${editandoTransaccion ? 'bg-warning' : 'bg-success'} text-white`}>
                  <h5 className="modal-title">
                    {editandoTransaccion ? '✏️ Editar Transacción' : '➕ Nueva Transacción'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={resetFormulario}></button>
                </div>
                <form onSubmit={manejarAgregarTransaccion}>
                  <div className="modal-body">
                    {!editandoTransaccion && (
                      <div className="mb-3">
                        <label className="form-label">Tipo</label>
                        <select
                          className="form-select"
                          value={formulario.tipo}
                          onChange={(e) => setFormulario({...formulario, tipo: e.target.value})}
                        >
                          <option value="costo">Costo</option>
                          <option value="gasto">Gasto</option>
                          <option value="venta">Venta</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label className="form-label">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Semilla de papa"
                        value={formulario.descripcion}
                        onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label">Cantidad</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={formulario.cantidad}
                          onChange={(e) => setFormulario({...formulario, cantidad: e.target.value})}
                          required
                          min="0"
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label">Valor Unitario ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={formulario.valorUnitario}
                          onChange={(e) => setFormulario({...formulario, valorUnitario: e.target.value})}
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="alert alert-info mb-0">
                      <strong>Total:</strong> ${(parseFloat(formulario.cantidad || 0) * parseFloat(formulario.valorUnitario || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={resetFormulario}>
                      Cancelar
                    </button>
                    <button type="submit" className={`btn ${editandoTransaccion ? 'btn-warning' : 'btn-success'}`}>
                      {editandoTransaccion ? 'Guardar Cambios' : 'Guardar Transacción'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de Transacciones */}
        <div className="card shadow-sm">
          <div className="card-header bg-white p-0">
            <ul className="nav nav-tabs card-header-tabs">
              {['costos', 'gastos', 'venta'].map(tab => (
                <li className="nav-item flex-fill text-center" key={tab}>
                  <button
                    className={`nav-link w-100 ${pestañaActiva === tab ? 'active fw-bold' : 'text-muted'}`}
                    onClick={() => setPestañaActiva(tab)}
                    style={{borderRadius: 0}}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body p-0">
            {transaccionesActuales.length > 0 ? (
              <>
                {/* Vista Desktop - Tabla */}
                <div className="d-none d-md-block">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Descripción</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-end">Valor Unit.</th>
                          <th className="text-end">Total</th>
                          <th className="text-center">Fecha</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaccionesActuales.map(t => (
                          <tr key={t._id}>
                            <td className="align-middle">{t.descripcion}</td>
                            <td className="text-center align-middle">{t.cantidad}</td>
                            <td className="text-end align-middle">${t.valorUnitario?.toLocaleString()}</td>
                            <td className="text-end align-middle fw-bold">${t.total?.toLocaleString()}</td>
                            <td className="text-center align-middle small text-muted">
                              {new Date(t.fecha).toLocaleDateString()}
                            </td>
                            <td className="text-center align-middle">
                              <button 
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => iniciarEdicion(t)}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => eliminarTransaccion(t._id)}
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista Mobile - Cards */}
                <div className="d-md-none">
                  {transaccionesActuales.map(t => (
                    <div key={t._id} className="p-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0 fw-bold">{t.descripcion}</h6>
                        <span className="badge bg-light text-dark">${t.total?.toLocaleString()}</span>
                      </div>
                      <div className="row text-muted small mb-3">
                        <div className="col-4">Cant: {t.cantidad}</div>
                        <div className="col-4">V/U: ${t.valorUnitario?.toLocaleString()}</div>
                        <div className="col-4">{new Date(t.fecha).toLocaleDateString()}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm flex-fill"
                          onClick={() => iniciarEdicion(t)}
                        >
                          <Edit2 size={14} className="me-1" /> Editar
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm flex-fill"
                          onClick={() => eliminarTransaccion(t._id)}
                        >
                          <Trash2 size={14} className="me-1" /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center p-5 text-muted">
                No hay {pestañaActiva} registradas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Proyecto;