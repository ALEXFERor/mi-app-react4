import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './home.css';
import { Link } from 'react-router-dom';

const Home = () => {
    const [mostrarSeccion, setMostrarSeccion] = useState('historial');
    const [clientesTop, setClientesTop] = useState([]);
    const [productosTop, setProductosTop] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);

    const cargarCategorias = async () => {
        const res = await axios.get('http://localhost:4000/api/categorias');
        setCategorias(res.data);
    };

    const cargarClientes = async () => {
        const res = await axios.get('http://localhost:4000/api/clientes');
        setClientes(res.data);
    };

    const cargarProductos = async () => {
        const res = await axios.get('http://localhost:4000/api/productos');
        setProductos(res.data);
    };

    const cargarVentas = async () => {
        const res = await axios.get('http://localhost:4000/api/ventas');
        setVentas(res.data);
    };

    const cargarResumen = async () => {
        const [ventasRes, productosRes, clientesRes] = await Promise.all([
            axios.get('http://localhost:4000/api/ventas'),
            axios.get('http://localhost:4000/api/productos'),
            axios.get('http://localhost:4000/api/clientes')
        ]);

        const productosMap = {};
        productosRes.data.forEach(p => {
            productosMap[p._id] = p.nombre;
        });

        const conteoProductos = {};
        ventasRes.data.forEach(v => {
            v.productos.forEach(p => {
                conteoProductos[p.producto_id] = (conteoProductos[p.producto_id] || 0) + p.cantidad;
            });
        });

        const topProductos = Object.entries(conteoProductos)
            .map(([id, cantidad]) => ({
                nombre: productosMap[id] || 'Producto desconocido',
                vendidos: cantidad
            }))
            .sort((a, b) => b.vendidos - a.vendidos)
            .slice(0, 10);
        setProductosTop(topProductos);

        const clientesMap = {};
        clientesRes.data.forEach(c => {
            clientesMap[c._id] = c.nombre;
        });

        const conteoClientes = {};
        ventasRes.data.forEach(v => {
            if (v.cliente_id) {
                conteoClientes[v.cliente_id] = (conteoClientes[v.cliente_id] || 0) + 1;
            }
        });

        const topClientes = Object.entries(conteoClientes)
            .map(([id, cantidad]) => ({
                nombre: clientesMap[id] || 'Cliente desconocido',
                compras: cantidad
            }))
            .sort((a, b) => b.compras - a.compras)
            .slice(0, 5);
        setClientesTop(topClientes);
    };

    useEffect(() => {
        cargarResumen();
        cargarProductos();
    }, []);

    const renderTabla = () => {
        switch (mostrarSeccion) {
            case 'categorias':
                return (
                    <table>
                        <thead className='table-q'><tr><th>Nombre</th><th>Descripción</th></tr></thead>
                        <tbody>
                            {categorias.map((c, i) => (
                                <tr key={i}><td>{c.nombre}</td><td>{c.descripcion}</td></tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'productos':
                return (
                    <table>
                        <thead className='table-q'><tr><th>Nombre</th><th>Precio</th><th>Stock</th></tr></thead>
                        <tbody>
                            {productos.map((p, i) => (
                                <tr key={i}><td>{p.nombre}</td><td>{p.precio}</td><td>{p.stock}</td></tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'clientes':
                return (
                    <table>
                        <thead className='table-q'>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo Documento</th>
                                <th>Documento</th>
                                <th>Teléfono</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((c, i) => (
                                <tr key={i}>
                                    <td>{c.nombre}</td>
                                    <td>{c.tipo_documento}</td>
                                    <td>{c.documento}</td>
                                    <td>{c.telefono}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'ventas':
                return (
                    <table>
                        <thead className='table-q'>
                            <tr>
                                <th>Tipo Doc</th>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Cantidad</th>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Total</th>
                                <th>Método Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map((v, i) => {
                                // Obtener el nombre del cliente
                                const cliente = clientes.find(c => c._id === v.cliente_id);

                                // Si no hay productos cargados, mostramos un mensaje de carga
                                if (productos.length === 0) {
                                    return <tr key={i}><td colSpan="8">Cargando productos...</td></tr>;
                                }

                                // Mostrar los productos de la venta
                                return v.productos.map((p, j) => {
                                    // Obtener el nombre del producto
                                    const producto = productos.find(pr => pr._id === p.producto_id);
                                    return (
                                        <tr key={`${i}-${j}`}>
                                            <td>{v.tipo_documento}</td>
                                            <td>{v.num_serie}</td>
                                            <td>{cliente ? cliente.nombre : 'Cliente desconocido'}</td>
                                            <td>{p.cantidad}</td>
                                            <td>{producto ? producto.nombre : 'Producto desconocido'}</td>
                                            <td>{p.precio}</td>
                                            <td>{p.total}</td>
                                            <td>{v.metodo_pago}</td>
                                        </tr>
                                    );
                                });
                            })}
                        </tbody>
                    </table>
                );

            case 'historial':
            default:
                return (
                    <div className="historial-section">
                        <div className="card tabla">
                            <h3>Top 5 Clientes</h3>
                            <ul>
                                {clientesTop.map((c, i) => (
                                    <li key={i}><span>{c.nombre}</span> - <span>{c.compras} compras</span></li>
                                ))}
                            </ul>
                        </div>
                        <div className="card tabla">
                            <h3>Top 10 Productos</h3>
                            <ul>
                                {productosTop.map((p, i) => (
                                    <li key={i}><span>{p.nombre}</span> - <span>{p.vendidos} vendidos</span></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
        }
    };

    return (
    <div className="home-container">
        <div className="status-bar-home">
            <div className="status-section-left">
                <div className="logo-home">odoo</div>
            </div>

            <div className="status-section-center">
                <div className="user-name">Base de datos</div>
            </div>

            <div className="status-section-right">
                <div className="status-controls-home">
                    <button className="status-btn-home-home" onClick={() => { setMostrarSeccion('historial'); }}>Historial</button>
                    <button className="status-btn-home-home" onClick={() => { setMostrarSeccion('categorias'); cargarCategorias(); }}>Categorías</button>
                    <button className="status-btn-home-home" onClick={() => { setMostrarSeccion('productos'); cargarProductos(); }}>Productos</button>
                    <button className="status-btn-home-home" onClick={() => { setMostrarSeccion('clientes'); cargarClientes(); }}>Clientes</button>
                    <button className="status-btn-home-home" onClick={() => { setMostrarSeccion('ventas'); cargarVentas(); }}>Ventas</button>
                    <Link to="/Pos">
                    <button className="status-btn-home-home">Realizar venta</button>
                    </Link>

                </div>
            </div>
        </div>

        <div className="tabla-contenido">
            {renderTabla()}
        </div>
    </div>
);

};

export default Home;
