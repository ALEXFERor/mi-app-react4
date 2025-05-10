import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Calendar, User, Home as HomeIcon } from 'lucide-react';
import './home.css'; // Importamos estilos CSS adicionales
import { Link } from 'react-router-dom';

const Home = () => {
  const [ventas, setVentas] = useState([]);
  const [filtro, setFiltro] = useState('dia');
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [totalVentas, setTotalVentas] = useState(0);

  const obtenerVentas = async () => {
    try {
      const { data } = await axios.get('http://localhost:4000/api/ventas');
      let ventasFiltradas = data.filter(v => {
        const fechaVenta = new Date(v.fecha);
        const inicio = new Date(fechaInicio + 'T00:00:00');
        const fin = new Date(fechaFin + 'T23:59:59');
        return fechaVenta >= inicio && fechaVenta <= fin;
      });


      if (clienteBusqueda.trim()) {
        const res = await axios.get('http://localhost:4000/api/clientes');
        const cliente = res.data.find(c =>
          c.nombre.toLowerCase().includes(clienteBusqueda.toLowerCase()) ||
          c.documento.includes(clienteBusqueda)
        );
        if (cliente) {
          ventasFiltradas = ventasFiltradas.filter(v => v.cliente_id === cliente._id);
        } else {
          ventasFiltradas = [];
        }
      }

      const agrupadas = {};
      ventasFiltradas.forEach(v => {
        const fecha = new Date(v.fecha);
        let key;
        if (filtro === 'dia') key = format(fecha, 'dd/MM');
        else if (filtro === 'semana') key = `Semana ${format(fecha, 'I')}`;
        else key = format(fecha, 'MMMM');

        agrupadas[key] = (agrupadas[key] || 0) + v.total;
      });

      const resultado = Object.entries(agrupadas).map(([fecha, total]) => ({ fecha, total }));
      setVentas(resultado);
      setTotalVentas(ventasFiltradas.reduce((acc, v) => acc + v.total, 0));
    } catch (error) {
      console.error('Error obteniendo ventas', error);
    }
  };

  useEffect(() => {
    obtenerVentas();
  }, [fechaInicio, fechaFin, filtro, clienteBusqueda]);

  return (
    <div className="home-container">
      <div className="status-bar-home">
        <div className="status-section-left">
          <div className="logo-home">odoo</div>
        </div>

        <div className="status-section-center">
          <div className="user-name">Grafica de ventas</div>
        </div>

        <div className="status-section-right">
          <div className="status-controls-home">
            <Link to="/Pos">
              <button className="status-btn-home-home">Venta</button>
            </Link>

          </div>
        </div>
      </div>

      <main className="main-content p-6">
        <header className="header flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 Ventas</h1>
          <span className="text-gray-500 text-sm border px-3 py-1 rounded-md shadow-sm bg-white">
            {format(new Date(), 'dd/MM/yyyy')}
          </span>
        </header>

        <section className="filters grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
          <input
            type="text"
            placeholder="Cliente o DNI"
            value={clienteBusqueda}
            onChange={e => setClienteBusqueda(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </section>

        <section className="chart-area">
          <h2>Ventas por {filtro}</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={ventas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" />
              <YAxis domain={[0, 3000]} />
                <ReferenceLine y={3000}  />
              <Tooltip formatter={(value) => [`S/ ${value.toFixed(2)}`, 'Total']} />
              <Bar dataKey="total" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={100}>
                <LabelList dataKey="total" position="top" formatter={(value) => `S/ ${value}`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="total">
            Total: <span>S/ {totalVentas.toFixed(2)}</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
