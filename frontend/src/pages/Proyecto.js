import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertas } from '../hooks/useAlertas'; // ← AGREGADO
import AlertaToast from '../components/AlertaToast'; // ← AGREGADO
import './Proyecto.css';

function Proyecto({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Obtener userId del token (decodificación simple)
  const getUserIdFromToken = () => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id || payload._id || payload.userId;
    } catch (e) {
      return null;
    }
  };
  
  const userId = getUserIdFromToken();
  
  // Hook de alertas PUB/SUB - Sistema de notificaciones en tiempo real
  const { alertas, conectado, marcarLeida } = useAlertas(userId);
  
  const [proyecto, setProyecto] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [informe, setInforme] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('costos');
  const [cargando, setCargando] = useState(true);
  
  const [formulario, setFormulario] = useState({
    descripcion: '',
    cantidad: '',
    valorUnitario: ''
  });

  const [editandoId, setEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({
    descripcion: '',
    cantidad: '',
    valorUnitario: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
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
      alert('Error al cargar el proyecto');
    } finally {
      setCargando(false);
    }
  };

  const manejarAgregarTransaccion = async (e) => {
    e.preventDefault();
    try {
      const tipo = pestañaActiva.slice(0, -1);
      
      const response = await api.post('/transacciones', {
        proyecto: id,
        tipo: tipo,
        descripcion: formulario.descripcion,
        cantidad: parseFloat(formulario.cantidad),
        valorUnitario: parseFloat(formulario.valorUnitario)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Verificar si el backend envió una alerta de pérdida
      if (response.data.alerta) {
        console.log('🚨 Alerta recibida del servidor:', response.data.alerta);
        // La alerta también llegará por WebSocket, pero aquí la tenemos inmediatamente
      }

      setFormulario({ descripcion: '', cantidad: '', valorUnitario: '' });
      cargarDatos();
      
    } catch (error) {
      console.error('Error al agregar:', error);
      alert('Error al guardar la transacción');
    }
  };

  // ... (resto de funciones sin cambios: iniciarEdicion, guardarEdicion, etc.)

  const iniciarEdicion = (transaccion) => {
    setEditandoId(transaccion._id);
    setDatosEdicion({
      descripcion: transaccion.descripcion,
      cantidad: transaccion.cantidad,
      valorUnitario: transaccion.valorUnitario
    });
  };

  const guardarEdicion = async (transaccionId) => {
    try {
      await api.put(`/transacciones/${transaccionId}`, {
        descripcion: datosEdicion.descripcion,
        cantidad: parseFloat(datosEdicion.cantidad),
        valorUnitario: parseFloat(datosEdicion.valorUnitario)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEditandoId(null);
      cargarDatos();
      alert('Registro actualizado correctamente');
    } catch (error) {
      console.error('Error al editar:', error);
      alert('Error al actualizar el registro');
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setDatosEdicion({ descripcion: '', cantidad: '', valorUnitario: '' });
  };

  const eliminarTransaccion = async (transaccionId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await api.delete(`/transacciones/${transaccionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        cargarDatos();
        alert('Registro eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el registro');
      }
    }
  };

  const manejarFinalizar = async () => {
    if (window.confirm('¿Desea dar por terminado este proyecto?')) {
      try {
        await api.put(`/proyectos/${id}`, {
          estado: 'finalizado'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Proyecto finalizado exitosamente');
        cargarDatos();
      } catch (error) {
        alert('Error al finalizar proyecto');
      }
    }
  };

  const manejarBorrar = async () => {
    if (window.confirm('¿Desea borrar los datos de este proyecto?')) {
      try {
        await api.delete(`/proyectos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Proyecto eliminado');
        navigate('/dashboard');
      } catch (error) {
        alert('Error al eliminar proyecto');
      }
    }
  };

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

  const tipoActual = pestañaActiva.slice(0, -1);
  const transaccionesFiltradas = transacciones.filter(t => t.tipo === tipoActual);

  return (
    <div className="proyecto-container">
      {/* INDICADOR DE CONEXIÓN PUB/SUB */}
      <div style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        padding: '5px 10px',
        background: conectado ? '#27ae60' : '#e74c3c',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        {conectado ? '🟢 Alertas activas' : '🔴 Sin conexión'}
      </div>

      {/* CONTENEDOR DE ALERTAS EN TIEMPO REAL */}
      <div className="contenedor-alertas" style={{
        position: 'fixed',
        top: '50px',
        right: '20px',
        zIndex: 9998,
        maxWidth: '400px'
      }}>
        {alertas.map((alerta, index) => (
          <AlertaToast 
            key={index} 
            alerta={alerta} 
            onClose={() => marcarLeida(index)}
          />
        ))}
      </div>

      <div className="bg-success text-white p-4 mb-4">
        <button className="btn btn-light btn-sm mb-3" onClick={() => navigate('/dashboard')}>
          ← Volver al Dashboard
        </button>
        <h1>{proyecto.nombre}</h1>
        <p className="mb-0">
          <strong>Socio:</strong> {proyecto.socio || 'N/A'} | 
          <strong> Modalidad:</strong> {proyecto.modalidad || 'N/A'} | 
          <strong> Estado:</strong> {proyecto.estado}
        </p>
      </div>

      <div className="container">
        {/* ... (resto del código sin cambios hasta el final) ... */}
        
        {informe && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center border-danger">
                <div className="card-body">
                  <h6 className="text-muted">TOTAL COSTOS</h6>
                  <h3 className="text-danger">${informe.costos?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-warning">
                <div className="card-body">
                  <h6 className="text-muted">TOTAL GASTOS</h6>
                  <h3 className="text-warning">${informe.gastos?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-info">
                <div className="card-body">
                  <h6 className="text-muted">TOTAL VENTAS</h6>
                  <h3 className="text-info">${informe.ventas?.toLocaleString() || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h6 className="text-muted">GANANCIA/PÉRDIDA</h6>
                  <h3 className={informe.ganancia >= 0 ? 'text-success' : 'text-danger'}>
                    ${informe.ganancia?.toLocaleString() || 0}
                  </h3>
                  <small className="text-muted">
                    Margen: {informe.margenRentabilidad?.toFixed(1) || 0}%
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header p-0">
            <div className="btn-group w-100" role="group">
              {['costos', 'gastos', 'ventas', 'informe', 'finalizar', 'borrar'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`btn ${pestañaActiva === tab ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => {
                    if (tab === 'finalizar') {
                      manejarFinalizar();
                    } else if (tab === 'borrar') {
                      manejarBorrar();
                    } else {
                      setPestañaActiva(tab);
                      setEditandoId(null);
                    }
                  }}
                >
                  {tab === 'costos' && '💰 COSTO'}
                  {tab === 'gastos' && '💸 GASTO'}
                  {tab === 'ventas' && '💵 VENTA'}
                  {tab === 'informe' && '📊 INFORME'}
                  {tab === 'finalizar' && '✅ FINALIZAR'}
                  {tab === 'borrar' && '🗑️ BORRAR'}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">
            {pestañaActiva === 'informe' && informe && (
              <div className="informe-section">
                <h4 className="mb-4">📈 Informe Financiero Detallado</h4>
                <div className="row">
                  <div className="col-md-6">
                    <table className="table table-bordered">
                      <tbody>
                        <tr className="table-danger">
                          <td><strong>Total Costos:</strong></td>
                          <td className="text-end">${informe.costos?.toLocaleString()}</td>
                        </tr>
                        <tr className="table-warning">
                          <td><strong>Total Gastos:</strong></td>
                          <td className="text-end">${informe.gastos?.toLocaleString()}</td>
                        </tr>
                        <tr className="table-active">
                          <td><strong>Total Inversión:</strong></td>
                          <td className="text-end">${informe.totalInversión?.toLocaleString()}</td>
                        </tr>
                        <tr className="table-info">
                          <td><strong>Total Ventas:</strong></td>
                          <td className="text-end">${informe.ventas?.toLocaleString()}</td>
                        </tr>
                        <tr className={informe.ganancia >= 0 ? 'table-success' : 'table-danger'}>
                          <td><strong>Ganancia/Pérdida Neta:</strong></td>
                          <td className="text-end">
                            <h4>${informe.ganancia?.toLocaleString()}</h4>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Margen de Rentabilidad:</strong></td>
                          <td className="text-end">{informe.margenRentabilidad?.toFixed(2)}%</td>
                        </tr>
                        <tr>
                          <td><strong>Estado:</strong></td>
                          <td className="text-end">
                            <span className={`badge ${informe.rentable ? 'bg-success' : 'bg-danger'}`}>
                              {informe.rentable ? 'RENTABLE' : 'NO RENTABLE'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <div className="alert alert-info">
                      <h5>💡 Fórmula utilizada:</h5>
                      <p><strong>Ganancia = Ventas - (Costos + Gastos)</strong></p>
                      <p className="mb-0">
                        El margen de rentabilidad indica el porcentaje de ganancia 
                        sobre la inversión total realizada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(pestañaActiva === 'costos' || pestañaActiva === 'gastos' || pestañaActiva === 'ventas') && (
              <>
                <div className="mb-4 p-3 bg-light rounded">
                  <h5>Registrar {tipoActual.toUpperCase()}</h5>
                  <form onSubmit={manejarAgregarTransaccion}>
                    <div className="row">
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control"
                          placeholder={
                            pestañaActiva === 'costos' ? "Descripción (ej: Abono, Semillas, Fungicida)" :
                            pestañaActiva === 'gastos' ? "Descripción (ej: Transporte, Mano de obra, Mantenimiento)" :
                            "Descripción (ej: Producto, Cosecha, Bultos de papa)"
                          }
                          value={formulario.descripcion}
                          onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}
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
                          ➕ Agregar
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover table-excel">
                    <thead className="table-success">
                      <tr>
                        <th style={{width: '30%'}}>DESCRIPCIÓN</th>
                        <th style={{width: '12%'}}>CANTIDAD</th>
                        <th style={{width: '18%'}}>V/UNITARIO</th>
                        <th style={{width: '18%'}}>TOTAL</th>
                        <th style={{width: '22%'}}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaccionesFiltradas.length > 0 ? (
                        transaccionesFiltradas.map((t) => (
                          <tr key={t._id}>
                            {editandoId === t._id ? (
                              <>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={datosEdicion.descripcion}
                                    onChange={(e) => setDatosEdicion({...datosEdicion, descripcion: e.target.value})}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={datosEdicion.cantidad}
                                    onChange={(e) => setDatosEdicion({...datosEdicion, cantidad: e.target.value})}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={datosEdicion.valorUnitario}
                                    onChange={(e) => setDatosEdicion({...datosEdicion, valorUnitario: e.target.value})}
                                  />
                                </td>
                                <td className="text-end fw-bold">
                                  ${(parseFloat(datosEdicion.cantidad) * parseFloat(datosEdicion.valorUnitario)).toLocaleString()}
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-success me-1"
                                    onClick={() => guardarEdicion(t._id)}
                                  >
                                    💾 Guardar
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-secondary"
                                    onClick={cancelarEdicion}
                                  >
                                    ❌ Cancelar
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{t.descripcion}</td>
                                <td className="text-center">{t.cantidad}</td>
                                <td className="text-end">${t.valorUnitario?.toLocaleString()}</td>
                                <td className="text-end fw-bold">${t.total?.toLocaleString()}</td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-primary me-1"
                                    onClick={() => iniciarEdicion(t)}
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-danger"
                                    onClick={() => eliminarTransaccion(t._id)}
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            No hay {pestañaActiva} registrados. Agrega uno arriba.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="table-active">
                      <tr>
                        <td colSpan="3" className="text-end fw-bold">TOTAL {tipoActual.toUpperCase()}:</td>
                        <td className="text-end fw-bold text-success">
                          ${transaccionesFiltradas.reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="alert alert-light border mt-3">
                  <small className="text-muted">
                    💡 <strong>Ejemplos:</strong>
                    {pestañaActiva === 'costos' && ' Insumos agrícolas, preparación de tierra, compra de semillas.'}
                    {pestañaActiva === 'gastos' && ' Transporte, mano de obra (jornales), mantenimiento.'}
                    {pestañaActiva === 'ventas' && ' Venta por cosecha, precios de mercado, cantidades vendidas.'}
                  </small>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Proyecto;