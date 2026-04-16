import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
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
      await api.post('/transacciones', {
        proyecto: id,
        tipo: formulario.tipo,
        descripcion: formulario.descripcion,
        cantidad: parseFloat(formulario.cantidad),
        valorUnitario: parseFloat(formulario.valorUnitario)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormulario({ tipo: 'costo', descripcion: '', cantidad: '', valorUnitario: '' });
      cargarDatos();
    } catch (error) {
      console.error('Error al agregar transacción:', error);
      alert('Error al agregar transacción');
    }
  };

  if (cargando) {
    return <div className="text-center mt-5"><div className="spinner-border text-success"></div></div>;
  }

  if (!proyecto) {
    return <div className="alert alert-danger m-5">Proyecto no encontrado</div>;
  }

  const transaccionesActuales = transacciones.filter(t => t.tipo === pestañaActiva);

  return (
    <div className="proyecto-container">
      <div className="bg-success text-white p-4 mb-4">
        <button className="btn btn-light btn-sm mb-3" onClick={() => navigate('/dashboard')}>
          ← Volver
        </button>
        <h1>{proyecto.nombre}</h1>
        <p className="mb-0">Socio: {proyecto.socio || 'N/A'} | Modalidad: {proyecto.modalidad || 'N/A'}</p>
      </div>

      <div className="container">
        {informe && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="text-muted">Costos</h6>
                  <h3 className="text-danger">${informe.costos?.toFixed(0) || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="text-muted">Gastos</h6>
                  <h3 className="text-warning">${informe.gastos?.toFixed(0) || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="text-muted">Ventas</h6>
                  <h3 className="text-info">${informe.ventas?.toFixed(0) || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="text-muted">Ganancia/Pérdida</h6>
                  <h3 className={informe.ganancia >= 0 ? 'text-success' : 'text-danger'}>
                    ${informe.ganancia?.toFixed(0) || 0}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Registrar Transacción</h5>
          </div>
          <div className="card-body">
            <form onSubmit={manejarAgregarTransaccion}>
              <div className="row mb-3">
                <div className="col-md-6">
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
                <div className="col-md-6">
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
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Cantidad</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={formulario.cantidad}
                    onChange={(e) => setFormulario({...formulario, cantidad: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valor Unitario</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={formulario.valorUnitario}
                    onChange={(e) => setFormulario({...formulario, valorUnitario: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Guardar Transacción</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs" role="tablist">
              {['costos', 'gastos', 'venta'].map(tab => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${pestañaActiva === tab ? 'active' : ''}`}
                    onClick={() => setPestañaActiva(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body">
            {transaccionesActuales.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-success">
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>V/U</th>
                      <th>Total</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaccionesActuales.map(t => (
                      <tr key={t._id}>
                        <td>{t.descripcion}</td>
                        <td>{t.cantidad}</td>
                        <td>${t.valorUnitario?.toFixed(0)}</td>
                        <td>${t.total?.toFixed(0)}</td>
                        <td>{new Date(t.fecha).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center">No hay {pestañaActiva} registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Proyecto;