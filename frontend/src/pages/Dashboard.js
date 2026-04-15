import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ usuario, onLogout }) {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState({
    nombre: '',
    socio: '',
    inicio: '',
    modalidad: ''
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Función para cargar proyectos (usando api)
  const cargarProyectos = async () => {
    try {
      setCargando(true);
      const response = await api.get('/proyectos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProyectos(response.data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarProyectos();
    }
  }, [token]); // Dependencia correcta

  const manejarCrearProyecto = async (e) => {
    e.preventDefault();
    try {
      await api.post('/proyectos', nuevoProyecto, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNuevoProyecto({ nombre: '', socio: '', inicio: '', modalidad: '' });
      setMostrarFormulario(false);
      cargarProyectos();
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      alert('Error al crear proyecto');
    }
  };

  const manejarEliminarProyecto = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      try {
        await api.delete(`/proyectos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        cargarProyectos();
      } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        alert('Error al eliminar proyecto');
      }
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container-fluid">
          <span className="navbar-brand">🌾 SCA AgroCuentas</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white">Hola, {usuario.nombre}</span>
            <button className="btn btn-light btn-sm" onClick={() => {
              onLogout();
              navigate('/login');
            }}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Mis Proyectos Agrícolas</h2>
          <button 
            className="btn btn-success"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            ➕ Nuevo Proyecto
          </button>
        </div>

        {mostrarFormulario && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Crear Nuevo Proyecto</h5>
              <form onSubmit={manejarCrearProyecto}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre del Proyecto</label>
                    <input
                      type="text"
                      className="form-control"
                      value={nuevoProyecto.nombre}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Socio (opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={nuevoProyecto.socio}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, socio: e.target.value})}
                    />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Fecha de Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={nuevoProyecto.inicio}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, inicio: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Modalidad</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Riego, Secano"
                      value={nuevoProyecto.modalidad}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, modalidad: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success">Crear Proyecto</button>
              </form>
            </div>
          </div>
        )}

        {cargando ? (
          <div className="text-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : proyectos.length > 0 ? (
          <div className="row">
            {proyectos.map(proyecto => (
              <div key={proyecto._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card proyecto-card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{proyecto.nombre}</h5>
                    <p className="card-text">
                      <small className="text-muted">
                        Socio: {proyecto.socio || 'N/A'}<br/>
                        Modalidad: {proyecto.modalidad || 'N/A'}
                      </small>
                    </p>
                    <span className={`badge ${proyecto.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                      {proyecto.estado}
                    </span>
                  </div>
                  <div className="card-footer bg-white border-top">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/proyecto/${proyecto._id}`)}
                    >
                      Ver Detalles
                    </button>
                    <button 
                      className="btn btn-sm btn-danger ms-2"
                      onClick={() => manejarEliminarProyecto(proyecto._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            No hay proyectos. ¡Crea uno para empezar!
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;