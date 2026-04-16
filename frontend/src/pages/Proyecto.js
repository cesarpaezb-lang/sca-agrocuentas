import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Proyecto.css';

function Proyecto({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // El resto del componente (render) se mantiene igual...
}