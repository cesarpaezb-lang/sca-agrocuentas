import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Edit2, Trash2, AlertCircle, ArrowLeft, FileText, CheckCircle, Trash, DollarSign, ShoppingCart, TrendingUp, Plus, Save } from 'lucide-react';
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
      {/* Header */}
      <div className="bg-success text-white p-4 mb-4">
        <div className="container">
          <button 
            className="btn btn-light btn-sm mb-3 d-flex align-items-center gap-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <h1 className="h2 mb-2">{proyecto.nombre}</h1>
          <div className="text-white-50">
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

        {/* Barra de Progreso */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <h6 className="mb-0">Control de Presupuesto</h6>
              <span className={presupuestoExcedido ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                {porcentajeUsado.toFixed(1)}% usado
              </span>
            </div>
            <div className="progress" style={{height: '30px'}}>
              <div 
                className={`progress-bar ${presupuestoExcedido ? 'bg-danger' : 'bg-success'}`}
                role="progressbar"
                style={{width: `${Math.min(porcentajeUsado, 100)}%`}}
              >
                ${gastosTotales.toLocaleString()}
              </div>
            </div>
            <div className="d-flex justify-content-between text-muted small mt-2">
              <span>Gastado: ${gastosTotales.toLocaleString()}</span>
              <span>Presupuesto: ${inversionTotal.toLocaleString()}</span>
              <span className={presupuestoRestante < 0 ? 'text-danger fw-bold' : ''}>
                Restante: ${presupuestoRestante.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cards de Resumen */}
        {informe && (
          <div className="row mb-4 g-3">
            <div className="col-6 col-md-3">
              <div className="card text-center border-danger h-100">
                <div className="card-body">
                  <h6 className="text-muted small">Total Costos</h6>
                  <h4 className="text-danger mb-0">${informe.costos?.toLocaleString() || 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center border-warning h-100">
                <div className="card-body">
                  <h6 className="text-muted small">Total Gastos</h6>
                  <h4 className="text-warning mb-0">${informe.gastos?.toLocaleString() || 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center border-info h-100">
                <div className="card-body">
                  <h6 className="text-muted small">Total Ventas</h6>
                  <h4 className="text-info mb-0">${informe.ventas?.toLocaleString() || 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className={`card text-center h-100 ${informe.ganancia >= 0 ? 'border-success' : 'border-danger'}`}>
                <div className="card-body">
                  <h6 className="text-muted small">Ganancia/Pérdida</h6>
                  <h4 className={`mb-0 ${informe.ganancia >= 0 ? 'text-success' : 'text-danger'}`}>
                    ${informe.ganancia?.toLocaleString() || 0}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestañas */}
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
                    className={`btn w-100 py-3 rounded-0 border-end ${pestañaActiva === tab.id ? `btn-${tab.color} text-white` : 'btn-outline-light text-dark'}`}
                    onClick={() => setPestañaActiva(tab.id)}
                    style={{borderBottom: pestañaActiva === tab.id ? '3px solid #000' : 'none'}}
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
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
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
                      <label className="form-label fw-bold">Descripción</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={formulario.descripcion}
                        onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}
                        required
                      />
                    </div>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label fw-bold">Cantidad</label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          value={formulario.cantidad}
                          onChange={(e) => setFormulario({...formulario, cantidad: e.target.value})}
                          required
                          min="0"
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label fw-bold">Valor Unitario ($)</label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          value={formulario.valorUnitario}
                          onChange={(e) => setFormulario({...formulario, valorUnitario: e.target.value})}
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <strong>Total:</strong> ${(parseFloat(formulario.cantidad || 0) * parseFloat(formulario.valorUnitario || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary btn-lg" onClick={resetFormulario}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg">
                      <Save className="me-2" size={20} />
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Contenido según pestaña */}
        {pestañaActiva === 'informe' && (
          <div className="card border-primary shadow-sm">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0"><FileText className="me-2" size={24} /> Informe Financiero Detallado</h5>
            </div>
            <div className="card-body">
              {informe && (
                <div className="row">
                  <div className="col-md-6">
                    <table className="table table-bordered table-striped border-2">
                      <tbody style={{border: '2px solid #dee2e6'}}>
                        <tr className="table-danger">
                          <td className="fw-bold border">Total Costos:</td>
                          <td className="text-end border">${informe.costos?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-warning">
                          <td className="fw-bold border">Total Gastos:</td>
                          <td className="text-end border">${informe.gastos?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-secondary">
                          <td className="fw-bold border">Total Inversión:</td>
                          <td className="text-end border">${(informe.costos + informe.gastos)?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-info">
                          <td className="fw-bold border">Total Ventas:</td>
                          <td className="text-end border">${informe.ventas?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className={informe.ganancia >= 0 ? 'table-success' : 'table-danger'}>
                          <td className="fw-bold border">Ganancia/Pérdida Neta:</td>
                          <td className="text-end fw-bold border">${informe.ganancia?.toLocaleString() || 0}</td>
                        </tr>
                        <tr className="table-light">
                          <td className="fw-bold border">Margen de Rentabilidad:</td>
                          <td className="text-end border">{informe.margenRentabilidad?.toFixed(2) || 0}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <div className="alert alert-info h-100">
                      <h6>💡 Fórmula utilizada:</h6>
                      <p className="mb-2"><strong>Ganancia = Ventas - (Costos + Gastos)</strong></p>
                      <p className="mb-0">El margen de rentabilidad indica el porcentaje de ganancia sobre la inversión total realizada.</p>
                      <hr/>
                      <div className={`alert ${informe.ganancia >= 0 ? 'alert-success' : 'alert-danger'} mb-0`}>
                        <strong>Estado:</strong> {informe.ganancia >= 0 ? 'PROYECTO RENTABLE ✅' : 'PROYECTO CON PÉRDIDAS ⚠️'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {pestañaActiva === 'finalizar' && (
          <div className="card border-success shadow-sm">
            <div className="card-header bg-success text-white py-3">
              <h5 className="mb-0"><CheckCircle className="me-2" size={24} /> Finalizar Proyecto</h5>
            </div>
            <div className="card-body text-center py-5">
              <h4 className="mb-3">¿Deseas finalizar este proyecto?</h4>
              <p className="text-muted mb-4">
                Al finalizar el proyecto, se marcará como completado y no podrás agregar más transacciones.<br/>
                <strong>Estado actual:</strong> <span className="badge bg-success fs-6">{proyecto.estado}</span>
              </p>
              {proyecto.estado === 'activo' ? (
                <button className="btn btn-success btn-lg px-5" onClick={finalizarProyecto}>
                  <CheckCircle className="me-2" size={24} />
                  Confirmar Finalización
                </button>
              ) : (
                <div className="alert alert-info">
                  <h5>Este proyecto ya ha sido finalizado.</h5>
                </div>
              )}
            </div>
          </div>
        )}

        {pestañaActiva === 'borrar' && (
          <div className="card border-danger shadow-sm">
            <div className="card-header bg-danger text-white py-3">
              <h5 className="mb-0"><Trash className="me-2" size={24} /> Eliminar Proyecto</h5>
            </div>
            <div className="card-body text-center py-5">
              <h4 className="text-danger mb-3">⚠️ Zona de Peligro</h4>
              <p className="text-muted mb-4 fs-5">
                Esta acción eliminará permanentemente el proyecto <strong>"{proyecto.nombre}"</strong><br/>
                y todas sus transacciones. <strong>Esta acción no se puede deshacer.</strong>
              </p>
              <button className="btn btn-outline-danger btn-lg px-5" onClick={borrarProyecto}>
                <Trash className="me-2" size={24} />
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        )}

        {['costos', 'gastos', 'venta'].includes(pestañaActiva) && (
          <div className="card shadow-sm">
            <div className="card-header bg-white p-0">
              <div className="btn-group w-100" role="group">
                {['costos', 'gastos', 'venta'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`btn py-3 ${pestañaActiva === tab ? 'btn-success active' : 'btn-outline-success'}`}
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
              <div className="bg-light p-4 rounded mb-4 border border-2">
                <h6 className="mb-3 text-uppercase fw-bold text-muted">
                  Registrar {pestañaActiva.slice(0, -1)}
                </h6>
                <form onSubmit={manejarAgregarTransaccion}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Semilla de papa"
                        value={formulario.descripcion}
                        onChange={(e) => setFormulario({...formulario, descripcion: e.target.value, tipo: pestañaActiva.slice(0, -1)})}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Cantidad</label>
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
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Valor Unitario ($)</label>
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
                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="btn btn-success w-100 py-2">
                        <Plus size={20} className="me-1" /> Agregar
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* TABLA TIPO EXCEL */}
              {transaccionesActuales.length > 0 ? (
                <>
                  {/* Vista Desktop */}
                  <div className="d-none d-md-block">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover" style={{border: '2px solid #198754'}}>
                        <thead style={{backgroundColor: '#198754', color: 'white'}}>
                          <tr className="text-center">
                            <th style={{border: '1px solid #146c43', padding: '12px'}}>DESCRIPCIÓN</th>
                            <th style={{border: '1px solid #146c43', padding: '12px', width: '100px'}}>CANT.</th>
                            <th style={{border: '1px solid #146c43', padding: '12px', width: '150px'}}>V. UNITARIO</th>
                            <th style={{border: '1px solid #146c43', padding: '12px', width: '150px'}}>TOTAL</th>
                            <th style={{border: '1px solid #146c43', padding: '12px', width: '120px'}}>ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody style={{border: '1px solid #dee2e6'}}>
                          {transaccionesActuales.map((t, index) => (
                            <tr key={t._id} style={{backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'}}>
                              <td style={{border: '1px solid #dee2e6', padding: '12px', verticalAlign: 'middle'}}>
                                <strong>{t.descripcion}</strong>
                              </td>
                              <td style={{border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', verticalAlign: 'middle'}}>
                                {t.cantidad}
                              </td>
                              <td style={{border: '1px solid #dee2e6', padding: '12px', textAlign: 'right', verticalAlign: 'middle'}}>
                                ${t.valorUnitario?.toLocaleString()}
                              </td>
                              <td style={{border: '1px solid #dee2e6', padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', color: '#198754'}}>
                                ${t.total?.toLocaleString()}
                              </td>
                              <td style={{border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', verticalAlign: 'middle'}}>
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-primary"
                                    onClick={() => iniciarEdicion(t)}
                                    title="Editar"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    className="btn btn-danger"
                                    onClick={() => eliminarTransaccion(t._id)}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{backgroundColor: '#212529', color: 'white', fontWeight: 'bold'}}>
                          <tr>
                            <td colSpan="3" style={{border: '1px solid #373b3e', padding: '12px', textAlign: 'right'}}>
                              TOTAL {pestañaActiva.toUpperCase()}:
                            </td>
                            <td style={{border: '1px solid #373b3e', padding: '12px', textAlign: 'right', fontSize: '1.1em'}}>
                              ${transaccionesActuales.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
                            </td>
                            <td style={{border: '1px solid #373b3e', padding: '12px'}}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Vista Mobile */}
                  <div className="d-md-none">
                    {transaccionesActuales.map(t => (
                      <div key={t._id} className="card mb-3 border-success shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="card-title mb-0 fw-bold text-success fs-5">{t.descripcion}</h6>
                            <span className="badge bg-success fs-6">${t.total?.toLocaleString()}</span>
                          </div>
                          <div className="row text-muted mb-3">
                            <div className="col-6">
                              <small>Cantidad: <strong>{t.cantidad}</strong></small>
                            </div>
                            <div className="col-6 text-end">
                              <small>V/U: <strong>${t.valorUnitario?.toLocaleString()}</strong></small>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-primary flex-fill"
                              onClick={() => iniciarEdicion(t)}
                            >
                              <Edit2 size={18} className="me-2" /> Editar
                            </button>
                            <button 
                              className="btn btn-danger flex-fill"
                              onClick={() => eliminarTransaccion(t._id)}
                            >
                              <Trash2 size={18} className="me-2" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="alert alert-dark text-center fw-bold fs-5 mb-0">
                      TOTAL: ${transaccionesActuales.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-5 text-muted bg-light rounded border-2 border">
                  <h5>No hay {pestañaActiva} registradas</h5>
                  <p className="mb-0">Usa el formulario de arriba para agregar la primera</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Proyecto;