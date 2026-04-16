import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Edit2, Trash2, AlertCircle, ArrowLeft, FileText, CheckCircle, Trash, DollarSign, ShoppingCart, TrendingUp, Plus } from 'lucide-react';
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

  const finalizarProyecto = async () => {
    if (window.confirm('¿Estás seguro de finalizar este proyecto? No podrás agregar más transacciones.')) {
      try {
        await api.put(`/proyectos/${id}`, {
          ...proyecto,
          estado: 'finalizado'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        cargarDatos();
        alert('Proyecto finalizado correctamente');
      } catch (error) {
        alert('Error al finalizar proyecto');
      }
    }
  };

  const borrarProyecto = async () => {
    if (window.confirm('⚠️ ¿ESTÁS SEGURO DE ELIMINAR PERMANENTEMENTE ESTE PROYECTO Y TODAS SUS TRANSACCIONES?')) {
      try {
        await api.delete(`/proyectos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/dashboard');
      } catch (error) {
        alert('Error al eliminar proyecto');
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

  // Filtrar transacciones según pestaña activa
  const transaccionesActuales = transacciones.filter(t => t.tipo === pestañaActiva);

  // Renderizar contenido según pestaña
  const renderContenido = () => {
    switch (pestañaActiva) {
      case 'informe':
        return (
          <div className="card border-primary">
            <div className="card-header bg-primary text-white">
              <FileText className="me-2" size={20} />
              Informe Financiero Detallado
            </div>
            <div className="card-body">
              {informe && (
                <div className="row">
                  <div className="col-md-6">
                    <table className="table table-bordered">
                      <tbody>
                        <tr className="table-danger">
                          <td><strong>Total Costos:</strong></td>
                          <td className="text-end">${informe.costos?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-warning">
                          <td><strong>Total Gastos:</strong></td>
                          <td className="text-end">${informe.gastos?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-secondary">
                          <td><strong>Total Inversión:</strong></td>
                          <td className="text-end">${(informe.costos + informe.gastos)?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-info">
                          <td><strong>Total Ventas:</strong></td>
                          <td className="text-end">${informe.ventas?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className={informe.ganancia >= 0 ? 'table-success' : 'table-danger'}>
                          <td><strong>Ganancia/Pérdida Neta:</strong></td>
                          <td className="text-end fw-bold">${informe.ganancia?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-light">
                          <td><strong>Margen de Rentabilidad:</strong></td>
                          <td className="text-end">{informe.margenRentabilidad?.toFixed(2) || 0}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <div className="alert alert-info">
                      <h6>💡 Fórmula utilizada:</h6>
                      <p className="mb-2"><strong>Ganancia = Ventas - (Costos + Gastos)</strong></p>
                      <p className="mb-0 small">El margen de rentabilidad indica el porcentaje de ganancia sobre la inversión total realizada.</p>
                    </div>
                    <div className={`alert ${informe.ganancia >= 0 ? 'alert-success' : 'alert-danger'}`}>
                      <strong>Estado:</strong> {informe.ganancia >= 0 ? 'PROYECTO RENTABLE' : 'PROYECTO CON PÉRDIDAS'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'finalizar':
        return (
          <div className="card border-success">
            <div className="card-header bg-success text-white">
              <CheckCircle className="me-2" size={20} />
              Finalizar Proyecto
            </div>
            <div className="card-body text-center py-5">
              <h4 className="mb-3">¿Deseas finalizar este proyecto?</h4>
              <p className="text-muted mb-4">
                Al finalizar el proyecto, se marcará como completado y no podrás agregar más transacciones.<br/>
                <strong>Estado actual:</strong> <span className="badge bg-success">{proyecto.estado}</span>
              </p>
              {proyecto.estado === 'activo' ? (
                <button className="btn btn-success btn-lg" onClick={finalizarProyecto}>
                  <CheckCircle className="me-2" size={24} />
                  Confirmar Finalización
                </button>
              ) : (
                <div className="alert alert-info">
                  Este proyecto ya ha sido finalizado.
                </div>
              )}
            </div>
          </div>
        );

      case 'borrar':
        return (
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <Trash className="me-2" size={20} />
              Eliminar Proyecto
            </div>
            <div className="card-body text-center py-5">
              <h4 className="text-danger mb-3">⚠️ Zona de Peligro</h4>
              <p className="text-muted mb-4">
                Esta acción eliminará permanentemente el proyecto <strong>"{proyecto.nombre}"</strong> y todas sus transacciones.<br/>
                <strong>Esta acción no se puede deshacer.</strong>
              </p>
              <button className="btn btn-outline-danger btn-lg" onClick={borrarProyecto}>
                <Trash className="me-2" size={24} />
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        );

      default:
        // costos, gastos, venta
        return (
          <div className="card shadow-sm">
            <div className="card-header bg-white p-0">
              <div className="d-flex border-bottom">
                {['costos', 'gastos', 'venta'].map((tab) => (
                  <button
                    key={tab}
                    className={`flex-fill btn btn-outline-success border-0 rounded-0 py-3 ${pestañaActiva === tab ? 'active bg-success text-white' : 'text-success'}`}
                    onClick={() => setPestañaActiva(tab)}
                  >
                    {tab === 'costos' && <ShoppingCart className="me-2" size={18} />}
                    {tab === 'gastos' && <DollarSign className="me-2" size={18} />}
                    {tab === 'venta' && <TrendingUp className="me-2" size={18} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="card-body">
              {/* Formulario de registro */}
              <div className="bg-light p-3 rounded mb-4">
                <h6 className="mb-3">Registrar {pestañaActiva.slice(0, -1).toUpperCase()}</h6>
                <form onSubmit={manejarAgregarTransaccion}>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Descripción (ej: Abono, Semillas)"
                        value={formulario.descripcion}
                        onChange={(e) => setFormulario({...formulario, descripcion: e.target.value, tipo: pestañaActiva.slice(0, -1)})}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Cantidad"
                        value={formulario.cantidad}
                        onChange={(e) => setFormulario({...formulario, cantidad: e.target.value})}
                        required
                        min="0"
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Valor Unitario ($)"
                        value={formulario.valorUnitario}
                        onChange={(e) => setFormulario({...formulario, valorUnitario: e.target.value})}
                        required
                        min="0"
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn btn-success w-100">
                        <Plus size={18} /> Agregar
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Tabla/Cards de transacciones */}
              {transaccionesActuales.length > 0 ? (
                <>
                  {/* Vista Desktop - Tabla tipo Excel */}
                  <div className="d-none d-md-block table-responsive">
                    <table className="table table-striped table-hover table-bordered">
                      <thead className="table-success">
                        <tr>
                          <th>DESCRIPCIÓN</th>
                          <th className="text-center">CANTIDAD</th>
                          <th className="text-end">V/UNITARIO</th>
                          <th className="text-end">TOTAL</th>
                          <th className="text-center">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaccionesActuales.map(t => (
                          <tr key={t._id}>
                            <td className="align-middle">{t.descripcion}</td>
                            <td className="text-center align-middle">{t.cantidad}</td>
                            <td className="text-end align-middle">${t.valorUnitario?.toLocaleString()}</td>
                            <td className="text-end align-middle fw-bold">${t.total?.toLocaleString()}</td>
                            <td className="text-center align-middle">
                              <button 
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => iniciarEdicion(t)}
                              >
                                <Edit2 size={16} /> Editar
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => eliminarTransaccion(t._id)}
                              >
                                <Trash2 size={16} /> Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-dark">
                        <tr>
                          <td colSpan="3" className="text-end"><strong>TOTAL {pestañaActiva.toUpperCase()}:</strong></td>
                          <td className="text-end">
                            <strong>
                              ${transaccionesActuales.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
                            </strong>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Vista Mobile - Cards */}
                  <div className="d-md-none">
                    {transaccionesActuales.map(t => (
                      <div key={t._id} className="card mb-3 border-success">
                        <div className="card-body">
                          <h6 className="card-title fw-bold">{t.descripcion}</h6>
                          <div className="row text-muted small mb-3">
                            <div className="col-4">Cant: {t.cantidad}</div>
                            <div className="col-4">V/U: ${t.valorUnitario?.toLocaleString()}</div>
                            <div className="col-4 text-end fw-bold text-success">${t.total?.toLocaleString()}</div>
                          </div>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-outline-primary flex-fill btn-sm"
                              onClick={() => iniciarEdicion(t)}
                            >
                              <Edit2 size={14} className="me-1" /> Editar
                            </button>
                            <button 
                              className="btn btn-outline-danger flex-fill btn-sm"
                              onClick={() => eliminarTransaccion(t._id)}
                            >
                              <Trash2 size={14} className="me-1" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="alert alert-dark text-center fw-bold">
                      TOTAL {pestañaActiva.toUpperCase()}: ${transaccionesActuales.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-5 text-muted">
                  No hay {pestañaActiva} registradas
                </div>
              )}
            </div>
          </div>
        );
    }
  };

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
            <div className="col-md-12">
              <p className="mb-1">
                <strong>Socios:</strong> {proyecto.socios?.map(s => `${s.nombre} ($${s.aporte?.toLocaleString()})`).join(', ') || 'N/A'}
              </p>
              <p className="mb-0">
                <strong>Inversión Total:</strong> ${inversionTotal.toLocaleString()} | 
                <strong> Modalidad:</strong> {proyecto.modalidad || 'N/A'} | 
                <strong> Estado:</strong> <span className="badge bg-light text-success">{proyecto.estado}</span>
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
                  <h6 className="text-muted small text-uppercase">Total Costos</h6>
                  <h3 className="text-danger mb-0">${informe.costos?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center h-100 border-warning">
                <div className="card-body">
                  <h6 className="text-muted small text-uppercase">Total Gastos</h6>
                  <h3 className="text-warning mb-0">${informe.gastos?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center h-100 border-info">
                <div className="card-body">
                  <h6 className="text-muted small text-uppercase">Total Ventas</h6>
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
                  {informe.margenRentabilidad !== undefined && (
                    <small className="text-muted">Margen: {informe.margenRentabilidad.toFixed(1)}%</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegación de Pestañas */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header p-0 bg-white">
            <div className="row g-0 text-center">
              {[
                { id: 'costos', icon: ShoppingCart, label: 'COSTO', color: 'danger' },
                { id: 'gastos', icon: DollarSign, label: 'GASTO', color: 'warning' },
                { id: 'venta', icon: TrendingUp, label: 'VENTA', color: 'info' },
                { id: 'informe', icon: FileText, label: 'INFORME', color: 'primary' },
                { id: 'finalizar', icon: CheckCircle, label: 'FINALIZAR', color: 'success' },
                { id: 'borrar', icon: Trash, label: 'BORRAR', color: 'danger' }
              ].map((tab) => (
                <div key={tab.id} className="col-4 col-md-2">
                  <button
                    className={`btn w-100 py-3 rounded-0 border-0 ${pestañaActiva === tab.id ? `btn-${tab.color} text-white` : 'btn-outline-light text-dark hover-bg-light'}`}
                    onClick={() => setPestañaActiva(tab.id)}
                  >
                    <tab.icon size={20} className="mb-1 d-block mx-auto" />
                    <small className="d-block">{tab.label}</small>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal de Edición */}
        {mostrarModal && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <Edit2 className="me-2" size={20} />
                    Editar Transacción
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={resetFormulario}></button>
                </div>
                <form onSubmit={manejarAgregarTransaccion}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
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
                          value={formulario.valorUnitario}
                          onChange={(e) => setFormulario({...formulario, valorUnitario: e.target.value})}
                          required
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={resetFormulario}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Contenido según pestaña */}
        {renderContenido()}
      </div>
    </div>
  );
}

export default Proyecto;