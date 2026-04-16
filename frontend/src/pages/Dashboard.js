import React, { useEffect, useState, useCallback } from 'react';
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

  // El resto del JSX igual...
}