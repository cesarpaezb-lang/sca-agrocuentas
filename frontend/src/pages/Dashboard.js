import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Users } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ usuario, onLogout }) {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para múltiples socios
  const [nuevoProyecto, setNuevoProyecto] = useState({
    nombre: '',
    socios: [{ nombre: '', aporte: '' }],
    inicio: '',
    modalidad: ''
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const cargarProyectos = useCallback(async () => {
    if (!token) return;
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
  }, [token]);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Funciones para manejar socios
  const agregarSocio = () => {
    setNuevoProyecto({
      ...nuevoProyecto,
      socios: [...nuevoProyecto.socios, { nombre: '', aporte: '' }]
    });
  };

  const eliminarSocio = (index) => {
    if (nuevoProyecto.socios.length > 1) {
      const nuevosSocios = nuevoProyecto.socios.filter((_, i) => i !== index);
      setNuevoProyecto({ ...nuevoProyecto, socios: nuevosSocios });
    }
  };

  const actualizarSocio = (index, campo, valor) => {
    const nuevosSocios = [...nuevoProyecto.socios];
    nuevosSocios[index][campo] = valor;
    setNuevoProyecto({ ...nuevoProyecto, socios: nuevosSocios });
  };

  const calcularInversionTotal = () => {
    return nuevoProyecto.socios.reduce((total, s) => total + (parseFloat(s.aporte) || 0), 0);
  };

  const manejarCrearProyecto = async (e) => {
    e.preventDefault();
    try {
      // Convertir aportes a números
      const proyectoData = {
        ...nuevoProyecto,
        socios: nuevoProyecto.socios.map(s => ({
          nombre: s.nombre,
          aporte: parseFloat(s.aporte) || 0
        }))
      };

      await api.post('/proyectos', proyectoData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Resetear formulario
      setNuevoProyecto({ 
        nombre: '', 
        socios: [{ nombre: '', aporte: '' }], 
        inicio: '', 
        modalidad: '' 
      });
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
          <div className="card mb-4 border-success">
            <div className="card-body">
              <h5 className="card-title mb-4">
                <Users className="me-2" size={20} />
                Crear Nuevo Proyecto
              </h5>
              <form onSubmit={manejarCrearProyecto}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Nombre del Proyecto</label>
                    <input
                      type="text"
                      className="form-control"
                      value={nuevoProyecto.nombre}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, nombre: e.target.value})}
                      required
                      placeholder="Ej: Cultivo de Papa"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Modalidad</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Riego, Secano"
                      value={nuevoProyecto.modalidad}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, modalidad: e.target.value})}
                    />
                  </div>
                </div>

                {/* Sección de Socios Mejorada */}
                <div className="mb-4 p-3 bg-light rounded border">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label fw-bold mb-0">Socios y Aportes</label>
                    <button 
                      type="button" 
                      className="btn btn-outline-success btn-sm"
                      onClick={agregarSocio}
                    >
                      <Plus size={16} /> Agregar Socio
                    </button>
                  </div>
                  
                  {nuevoProyecto.socios.map((socio, index) => (
                    <div key={index} className="row mb-2 align-items-end">
                      <div className="col-md-5">
                        <label className="form-label small text-muted">Nombre del Socio</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Socio ${index + 1}`}
                          value={socio.nombre}
                          onChange={(e) => actualizarSocio(index, 'nombre', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small text-muted">Aporte ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={socio.aporte}
                          onChange={(e) => actualizarSocio(index, 'aporte', e.target.value)}
                          min="0"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        {nuevoProyecto.socios.length > 1 && (
                          <button 
                            type="button"
                            className="btn btn-outline-danger btn-sm w-100"
                            onClick={() => eliminarSocio(index)}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="alert alert-info mt-3 mb-0 py-2">
                    <strong>Inversión Total Calculada:</strong> ${calcularInversionTotal().toLocaleString()}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Fecha de Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={nuevoProyecto.inicio}
                      onChange={(e) => setNuevoProyecto({...nuevoProyecto, inicio: e.target.value})}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success">
                    Crear Proyecto
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => setMostrarFormulario(false)}
                  >
                    Cancelar
                  </button>
                </div>
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
            {proyectos.map(proyecto => {
              // Calcular inversión total del proyecto
              const inversionTotal = proyecto.socios?.reduce((sum, s) => sum + (s.aporte || 0), 0) || 0;
              
              return (
                <div key={proyecto._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card proyecto-card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title text-success">{proyecto.nombre}</h5>
                      <p className="card-text">
                        <small className="text-muted d-block mb-1">
                          <strong>Socios:</strong> {proyecto.socios?.map(s => s.nombre).join(', ') || 'N/A'}
                        </small>
                        <small className="text-muted d-block mb-1">
                          <strong>Inversión:</strong> ${inversionTotal.toLocaleString()}
                        </small>
                        <small className="text-muted d-block">
                          <strong>Modalidad:</strong> {proyecto.modalidad || 'N/A'}
                        </small>
                      </p>
                      <span className={`badge ${proyecto.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                        {proyecto.estado}
                      </span>
                    </div>
                    <div className="card-footer bg-white border-top d-flex justify-content-between">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/proyecto/${proyecto._id}`)}
                      >
                        Ver Detalles
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => manejarEliminarProyecto(proyecto._id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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