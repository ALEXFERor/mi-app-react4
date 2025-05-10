import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css'; // Asegúrate de importar Bootstrap
import './POS.css'; // Asegúrate de tener este archivo con las clases de estilo
import wifiIcon from './img/wifi.png';
import Boleta from './Boleta';
import Factura from './Factura'; // Importa el nuevo componente
import { Link } from 'react-router-dom';

function App() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [venta, setVenta] = useState({
    cliente_id: '',
    cliente_nombre: '',
    productos: [],
    total: 0,
  });

  const [horaActual, setHoraActual] = useState('');
  const [inputValue, setInputValue] = useState(''); // Para la calculadora
  const [showModal, setShowModal] = useState(false); // Estado para controlar la visibilidad del modal
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [productoSearch, setProductoSearch] = useState('');
  const [mostrarPago, setMostrarPago] = useState(false);
  const [entregado, setEntregado] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [vuelto, setVuelto] = useState(null);
  const [mostrarBoleta, setMostrarBoleta] = useState(false);

  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [mostrarSeleccion, setMostrarSeleccion] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [documento, setDocumento] = useState('');
  const [numSerie, setNumSerie] = useState('');
  const [imagen, setImagen] = useState(null);


  useEffect(() => {
    cargarClientes();
    cargarVentas();
    cargarProductos();
    cargarCategorias();

    const intervalo = setInterval(() => {
      const ahora = new Date();
      const hora = ahora.toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setHoraActual(hora);
    }, 1000);

    return () => clearInterval(intervalo); // Limpiar al desmontar
  }, []);

  const cargarVentas = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/ventas');
      setVentas(res.data);
    } catch (error) {
      console.error('Error al cargar las ventas', error);
    }
  };

  const handleImagenChange = (e) => {
    setImagen(e.target.files[0]);
  };

  const cargarClientes = async () => {
    const res = await axios.get('http://localhost:4000/api/clientes');
    setClientes(res.data);
  };

  const cargarCategorias = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/categorias');
      console.log('Categorías cargadas:', res.data);
      setCategorias(res.data);
    } catch (error) {
      console.error('Error al cargar las categorías', error);
    }
  };

  const cargarProductos = async () => {
    const res = await axios.get('http://localhost:4000/api/productos');
    setProductos(res.data);
  };

  const handleAddProduct = (product) => {
    const qty = parseFloat(inputValue || 1); // Usar el valor de la calculadora
    const existing = venta.productos.find(item => item.producto_id === product._id);

    if (existing) {
      setVenta({
        ...venta,
        productos: venta.productos.map(item =>
          item.producto_id === product._id
            ? { ...item, cantidad: item.cantidad + qty, total: (item.cantidad + qty) * item.precio }
            : item
        ),
      });
    } else {
      setVenta({
        ...venta,
        productos: [...venta.productos, {
          producto_id: product._id,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: qty,
          total: qty * product.precio
        }],

      });
    }
    setInputValue(''); // Limpiar la entrada
  };

  const handleButton = (val) => {
    setInputValue(prev => prev + val);
  };

  const guardarVenta = async () => {
    if (!venta.cliente_id) {
      Swal.fire('Error', 'Seleccione un cliente', 'error');
      return;
    }

    if (!metodoPago) {
      Swal.fire('Error', 'Seleccione un método de pago', 'error');
      return;
    }
    if (!tipoDocumento) {
      Swal.fire('Error', 'Seleccione boleta o factura', 'error');
      return;
    }

    if (venta.productos.length === 0) {
      Swal.fire('Error', 'Agregue al menos un producto', 'error');
      return;
    }

    // Generar el número de serie
    let numSerie = null; // será generado por el backend


    const totalVenta = venta.productos.reduce((sum, item) => sum + item.total, 0);

    try {
      const ventaData = {
        cliente_id: venta.cliente_id,
        tipo_documento: tipoDocumento,
        num_serie: numSerie, // Aquí usamos el número de serie generado
        productos: venta.productos.map(producto => ({
          producto_id: producto.producto_id,
          cantidad: producto.cantidad,
          precio: producto.precio,
          total: producto.total
        })),
        total: totalVenta,
        metodo_pago: metodoPago,
        fecha: new Date().toISOString()
      };

      const response = await axios.post('http://localhost:4000/api/ventas', ventaData);

      Swal.fire('¡Venta realizada!', '', 'success');
      await cargarProductos();
      await cargarVentas();

      // Resetear estado
      setVenta({ cliente_id: '', cliente_nombre: '', productos: [], total: 0 });
      setMostrarPago(false);
      setMetodoPago('');
      setEntregado('');
      setVuelto(null);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Swal.fire('Error', error.response.data.error, 'error');
      } else {
        console.error(error);
        Swal.fire('Error', 'No se pudo guardar la venta', 'error');
      }
    }
  };



  const total = venta.productos.reduce((sum, item) => sum + item.total, 0).toFixed(2); // Calcular total

  // Filtrar clientes según el término de búsqueda
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCliente = (cliente) => {
    setVenta({
      ...venta,
      cliente_id: cliente._id,
      cliente_nombre: cliente.nombre,
      cliente_dni: cliente.documento,          // Añadir DNI
      cliente_telefono: cliente.telefono // Añadir teléfono
    });
    setShowModal(false); // Cerramos el modal
  };

  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(productoSearch.toLowerCase())
  );

  const guardarProducto = async (e) => {
    e.preventDefault();

    const form = e.target;
    const nombre = form.nombre.value.trim();
    const precio = form.precio.value.trim();
    const categoria_id = form.categoria_id.value.trim();
    const stock = form.stock.value.trim();
    const modelo = form.modelo.value.trim();
    const color = form.color.value.trim();

    if (!nombre || !precio || !categoria_id || !stock || !modelo || !color || !imagen) {
      Swal.fire('Error', 'Todos los campos son obligatorios, incluida la imagen', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('precio', parseFloat(precio));
    formData.append('categoria_id', categoria_id);
    formData.append('stock', parseInt(stock, 10));
    formData.append('modelo', modelo);
    formData.append('color', color);
    formData.append('imagen', imagen); // Agrega la imagen

    try {
      const response = await axios.post('http://localhost:4000/api/productos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.fire('¡Producto guardado!', '', 'success');
      setModalProducto(false);
      cargarProductos();
      form.reset();
    } catch (error) {
      console.error('Error al guardar el producto:', error.response?.data || error.message);
      Swal.fire('Error', 'No se pudo guardar el producto', 'error');
    }
  };


  const anularVenta = async () => {
    if (!ventaSeleccionada) {
      Swal.fire('Error', 'Seleccione una venta para anular', 'error');
      return;
    }

    // Devolver el stock del producto a la venta seleccionada
    try {
      const productosActualizados = ventaSeleccionada.productos.map(producto => {
        const productoActual = productos.find(p => p._id === producto.producto_id);
        if (productoActual) {
          // Actualizamos el stock
          productoActual.stock += producto.cantidad;
          return productoActual;
        }
        return producto;
      });

      // Actualizamos el stock de los productos en la base de datos
      await Promise.all(
        productosActualizados.map(producto =>
          axios.put(`http://localhost:4000/api/productos/${producto._id}`, { stock: producto.stock })
        )
      );

      // Eliminar la venta seleccionada
      await axios.delete(`http://localhost:4000/api/ventas/${ventaSeleccionada._id}`);

      // Refrescar las ventas
      cargarVentas();
      Swal.fire('Venta anulada', '', 'success');
      setVentaSeleccionada(null); // Limpiar la venta seleccionada
    } catch (error) {
      console.error('Error al anular la venta', error);
      Swal.fire('Error', 'No se pudo anular la venta', 'error');
    }
  };

  const guardarCliente = async (e) => {
    e.preventDefault();

    let error = false;

    // Validar cada campo
    if (!e.target.nombre.value.trim()) {
      Swal.fire('Error', 'El nombre del cliente es obligatorio', 'error');
      error = true;
    }
    if (!documento) {
      Swal.fire('Error', 'El número de documento es obligatorio', 'error');
      error = true;
    }
    if (!tipoDocumento) {
      Swal.fire('Error', 'Seleccione el tipo de documento', 'error');
      error = true;
    }
    if (!e.target.telefono.value.trim()) {
      Swal.fire('Error', 'El teléfono es obligatorio', 'error');
      error = true;
    }

    if (error) return;

    // Datos que se van a enviar al backend
    const clienteData = {
      nombre: e.target.nombre.value,
      tipo_documento: tipoDocumento,
      documento: documento,
      telefono: e.target.telefono.value
    };

    try {
      // Enviar los datos del cliente al backend
      const response = await axios.post('http://localhost:4000/api/clientes', clienteData);
      console.log('Cliente guardado', response.data);

      // Si el cliente fue guardado con éxito
      Swal.fire('¡Cliente guardado!', '', 'success');
      setModalCliente(false);
      cargarClientes(); // Cargar nuevamente la lista de clientes
    } catch (error) {
      console.error('Error al guardar el cliente', error);
      Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
    }
  };



  return (
    <div className="pos-container">
      {/* Panel de venta */}
      <div className="venta-panel">
        <div className="top-bar">
          <div className="logo">odoo</div>
          <div className="user-name">Alejandro Fernando</div>
        </div>

        <div className="venta-lista">
          {venta.productos.map(item => (
            <div key={item.producto_id} className="venta-item">
              <div>{item.nombre}</div>
              <div>
                Cantidad: {Number.isInteger(item.cantidad) ? item.cantidad : item.cantidad.toFixed(2)} Precio: S/ {item.precio.toFixed(2)}
              </div>

              <div>S/ {(item.cantidad * item.precio).toFixed(2)}</div>
            </div>
          ))}
          <div className="venta-total">
            <div className="total-linea">
              <hr />
              <div>Total: <strong>S/ {total}</strong></div>
            </div>
          </div>
          <div className="impuestos">Impuestos S/ 0,00</div>
        </div>

        <hr className="linea-verde" />
        <div className="calculadora">
          <div className="teclado-container">
            <div className="teclado">
              <div className="cliente" onClick={() => setShowModal(true)}>
                <span className="icono-cliente">👤</span>
                <span className="texto-cliente">{venta.cliente_nombre || 'Cliente'}</span>
              </div>
              <button className="pago" onClick={() => setMostrarPago(true)}>
                <span className="icono-pago">➤</span>
                <span className="texto-pago">Pago</span>
              </button>
              {[1, 2, 3, 'Cant', 4, 5, 6, 'Desc', 7, 8, 9, 'Precio', '+/-', 0, '.', '⌫'].map((btn, idx) => {
                const col = (idx % 4) + 3;
                const row = Math.floor(idx / 4) + 1;
                return (
                  <button
                    key={idx}
                    className={`${typeof btn === 'string' ? btn.toLowerCase() : 'numero'}`}
                    style={{ gridColumn: col, gridRow: row }}
                    onClick={() => handleButton(btn.toString())}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/** Mostrar  */}
      {mostrarPago && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Page</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarPago(false)}></button>
              </div>
              <div className="modal-body">
                {/* Tabla de resumen */}
                <table className="table table-bordered mb-4">
                  <thead>
                    <tr>
                      <th>Precio Total</th>
                      <th>Dinero Entregado</th>
                      <th>Vuelto</th>
                      <th>Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{total}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={entregado}
                          onChange={(e) => setEntregado(e.target.value)}
                        />
                      </td>
                      <td>{(entregado - total).toFixed(2)}</td>
                      <td>{metodoPago}</td>
                    </tr>
                  </tbody>
                </table>

                <hr />

                {/* Sección Valida */}
                <div className="mb-3">
                  <h6>Valida</h6>
                  <div className="d-flex gap-2 mb-3">
                    <button
                      className={`btn ${metodoPago === 'Dinero en efectivo (PEN)' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setMetodoPago('Dinero en efectivo (PEN)')}
                    >
                      Dinero en efectivo (PEN)
                    </button>
                  </div>

                  {/* Teclado numérico */}
                  <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {['1', '2', '3', '+10', '4', '5', '6', '+20', '7', '8', '9', '+50', 'C', '0', ',', '☑'].map((key) => (
                      <button
                        key={key}
                        className="btn btn-light"
                        onClick={() => {
                          if (key === 'C') {
                            setEntregado('0');
                          } else if (key === '☑') {
                            setMostrarSeleccion(true);  // Abrir selección de boleta o factura
                          } else if (key.startsWith('+')) {
                            const incremento = parseFloat(key.substring(1));
                            setEntregado(prev => (parseFloat(prev || 0) + incremento).toString());
                          } else {
                            setEntregado(prev => prev === '0' ? key : prev + key);
                          }
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {mostrarSeleccion && (
                    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                      <div className="modal-dialog">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Seleccionar Comprobante</h5>
                            <button type="button" className="btn-close" onClick={() => setMostrarSeleccion(false)}></button>
                          </div>
                          <div className="modal-body">
                            <p>¿Deseas generar Boleta o Factura?</p>
                          </div>
                          <div className="modal-footer">
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                setTipoDocumento('boleta');
                                setMostrarSeleccion(false);
                                setMostrarBoleta(true); // Mostrar modal boleta
                              }}
                            >
                              Boleta
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                setTipoDocumento('factura');
                                setMostrarSeleccion(false);
                                setMostrarFactura(true); // Mostrar modal factura
                              }}
                            >
                              Factura
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/** Previsualizacion de mostrar boleta */}
                  {mostrarBoleta && (
                    <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', height: '100vh' }}>
                      <div className="d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
                        <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '700px', maxHeight: '95vh' }}>
                          <div className="modal-content" style={{ maxHeight: '95vh', overflow: 'hidden' }}>
                            <div className="modal-header">
                              <h5 className="modal-title">Boleta</h5>
                              <button type="button" className="btn-close" onClick={() => setMostrarBoleta(false)}></button>
                            </div>

                            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '70vh', padding: '1rem' }}>
                              <Boleta
                                venta={{ ...venta, numSerie }}
                                total={total}
                                metodoPago={metodoPago}
                                entregado={entregado}
                                vuelto={entregado - total}
                              />
                            </div>

                            <div className="modal-footer d-flex justify-content-between">
                              <button
                                className="btn btn-success"
                                onClick={() => {
                                  guardarVenta('boleta');
                                  setMostrarBoleta(false); // cerrar el modal después de guardar
                                }}
                              >
                                Guardar Venta
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/** Previsualizacion para mostrar factura */}
                  {mostrarFactura && (
                    <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', height: '100vh' }}>
                      <div className="d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
                        <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '700px', maxHeight: '95vh' }}>
                          <div className="modal-content" style={{ maxHeight: '95vh', overflow: 'hidden' }}>
                            <div className="modal-header">
                              <h5 className="modal-title">Factura</h5>
                              <button type="button" className="btn-close" onClick={() => setMostrarFactura(false)}></button>
                            </div>

                            <div
                              className="modal-body"
                              style={{
                                overflowY: 'auto',
                                maxHeight: '70vh',
                                padding: '1rem'
                              }}
                            >
                              <Factura
                                venta={{ ...venta, numSerie }}
                                total={total}
                                metodoPago={metodoPago}
                                entregado={entregado}
                                vuelto={entregado - total}
                              />
                            </div>

                            <div className="modal-footer d-flex justify-content-between">
                              <button
                                className="btn btn-success"
                                onClick={() => {
                                  guardarVenta('factura');
                                  setMostrarFactura(false); // cerrar el modal después de guardar
                                }}
                              >
                                Guardar Venta
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Panel de productos */}
      <div className="productos-panel">
        <div className="status-bar">
          <div className="status-left">
            <div className="status-time">{horaActual}</div>
            <div className="status-controls">
              <Link to="/home">
                <button className="status-btn-home">Home</button>
              </Link>
              <Link to="/historial">
                <button className="status-btn-home">Historial</button>
              </Link>
            </div>
          </div>
          <div className="status-right">
            <div className="wifi-icon">
              <img src={wifiIcon} alt="WiFi" />
            </div>
            <div className="status-user">Cerrar</div>
          </div>
        </div>
        <div className="productos-header">
          <div className="titulo">Productos</div>
          <button
            className="btn btn-primary"
            onClick={() => setModalProducto(true)}
            style={{ marginLeft: '800px', marginRight: '0', display: 'block' }}
          >
            +
          </button>

          <input
            type="text"
            placeholder="Buscar Productos"
            className="buscar"
            value={productoSearch}
            onChange={(e) => setProductoSearch(e.target.value)}
          />

        </div>
        <div className="productos-grid">
          {productosFiltrados.map(producto => (
            <div
              key={producto._id}
              className="producto-card"
              onClick={() => handleAddProduct(producto)}
            >
              <div className="imagen-con-precio">
                <img
                  src={`http://localhost:4000${producto.imagen}`}
                  alt={producto.nombre}
                  className="producto-img"
                />
                <div className="precio-overlay">S/ {producto.precio} Stock: {producto.stock}</div>
              </div>
              <div className="nombre-producto">{producto.nombre}</div>
            </div>
          ))}
        </div>



        {/** Tabla de registros de ventas */}
        <div className="mb-5"></div>
        <div className="ventas-container">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h4 className="titulo">Registro de Ventas</h4>
          </div>

          <div className="table-responsive">
            <table className="table table-hover table-striped table-bordered">
              <thead className="thead-dark">
                <tr>
                  <th scope="col" className="text-center">Tipo Documento</th>
                  <th scope="col" className="text-center">Serie</th>
                  <th scope="col" className="text-center">Total</th>
                  <th scope="col" className="text-center">Método de Pago</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta, index) => (
                  <React.Fragment key={venta._id || index}>
                    <tr
                      className={ventaSeleccionada?._id === venta._id ? "table-active" : ""}
                      onClick={() =>
                        setVentaSeleccionada(
                          ventaSeleccionada?._id === venta._id ? null : venta
                        )
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="text-center">{venta.tipo_documento}</td>
                      <td className="text-center">{venta.num_serie}</td>
                      <td className="text-right font-weight-bold">S/{venta.total.toFixed(2)}</td>
                      <td className="text-center">{venta.metodo_pago}</td>
                    </tr>

                    {/* Detalle de productos de la venta */}
                    {ventaSeleccionada?._id === venta._id && (
                      <tr>
                        <td colSpan="4" className="p-0">
                          <table className="table table-sm table-bordered mb-0">
                            <thead>
                              <tr className="bg-light">
                                <th className="text-center">Producto</th>
                                <th className="text-center">Cantidad</th>
                                <th className="text-center">P. Unitario</th>
                                <th className="text-center">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {venta.productos.map((producto, idx) => {
                                // Aquí debes obtener el nombre del producto, asegúrate de que cada producto tenga el nombre
                                const productoEncontrado = productos.find(
                                  (prod) => prod._id === producto.producto_id
                                );
                                return (
                                  <tr key={idx}>
                                    <td>
                                      {productoEncontrado ? productoEncontrado.nombre : 'Producto desconocido'}
                                    </td>
                                    <td className="text-center">{producto.cantidad}</td>
                                    <td className="text-right">S/{producto.precio.toFixed(2)}</td>
                                    <td className="text-right">S/{producto.total.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>


            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              Mostrando {ventas.length} registros
            </div>
            <button
              className="btn btn-outline-danger"
              onClick={anularVenta}
              disabled={!ventaSeleccionada}
            >
              <i className="fas fa-trash-alt mr-2"></i>
              Anular Venta Seleccionada
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      {modalProducto && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Producto</h5>
                <button type="button" className="btn-close" onClick={() => setModalProducto(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={guardarProducto}>
                  <div className="mb-3">
                    <label className="form-label">Nombre del Producto</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      placeholder="Ingrese nombre del producto"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Precio</label>
                    <input
                      type="text"
                      className="form-control"
                      name="precio"
                      placeholder="Ingrese precio"
                      inputMode="numeric"  // Asegura que el teclado móvil muestre números
                      required
                      onInput={(e) => {
                        // Eliminar cualquier cosa que no sea un número
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Categoria</label>
                    <select className="form-select" name="categoria_id" required>
                      <option value="">Seleccione categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria._id} value={categoria._id}>{categoria.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Stock</label>
                    <input
                      type="text"
                      className="form-control"
                      name="stock"
                      placeholder="Ingrese cantidad en stock"
                      inputMode="numeric"  // Asegura que el teclado móvil muestre números
                      min="0"
                      required
                      onInput={(e) => {
                        // Eliminar cualquier cosa que no sea un número
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Imagen</label>
                    <input
                      type="file"
                      className="form-control"
                      name="imagen"
                      accept="image/*"
                      required
                      onChange={handleImagenChange}  // necesitas esta función
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Características</label>

                    {/* Campo para Modelo */}
                    <div className="mb-3">
                      <label className="form-label">Modelo</label>
                      <input
                        type="text"
                        className="form-control"
                        name="modelo"
                        placeholder="Ingrese el modelo"
                        required
                      />
                    </div>

                    {/* Campo para Color */}
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <input
                        type="text"
                        className="form-control"
                        name="color"
                        placeholder="Ingrese el color"
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary">
                      Guardar Producto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}


      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Seleccionar Cliente</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* Búsqueda de clientes */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar cliente"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginRight: '10px' }} // Un pequeño margen a la derecha para separar el botón
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => setModalCliente(true)}
                  >
                    +
                  </button>
                </div>

                {/* Listado de clientes filtrados */}
                <ul className="list-group mt-3">
                  {clientesFiltrados.map(cliente => (
                    <li
                      key={cliente._id}
                      className="list-group-item list-group-item-action"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectCliente(cliente)} // Llamamos a la función para seleccionar el cliente
                    >
                      {cliente.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCliente && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Cliente</h5>
                <button type="button" className="btn-close" onClick={() => setModalCliente(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={guardarCliente}>
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingrese nombre del cliente"
                      name="nombre"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tipo de Documento</label>
                    <select
                      className="form-select"
                      name="tipo_documento"
                      onChange={(e) => {
                        const value = e.target.value;
                        setTipoDocumento(value);
                        setDocumento('');  // Resetear el número de documento cuando cambie el tipo
                      }}
                      value={tipoDocumento}
                      required
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="dni">DNI</option>
                      <option value="ruc">RUC</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Número de Documento</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingrese número de documento"
                      name="documento"
                      value={documento}
                      onChange={(e) => {
                        let value = e.target.value;
                        const maxLength = tipoDocumento === 'dni' ? 8 : tipoDocumento === 'ruc' ? 11 : null;

                        value = value.replace(/\D/g, '').slice(0, maxLength);  // Limitar al número máximo de caracteres

                        setDocumento(value);
                      }}
                      maxLength={tipoDocumento === 'dni' ? 8 : tipoDocumento === 'ruc' ? 12 : ''}
                      title="Ingrese solo números"
                      required
                    />
                  </div>


                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingrese teléfono"
                      name="telefono"
                      maxLength={9}
                      pattern="[0-9]{9}"  // Solo números de exactamente 9 dígitos
                      inputMode="numeric"  // Asegura que el teclado móvil muestre números
                      title="Ingrese un número válido de 9 dígitos"
                      required
                      onInput={(e) => {
                        // Eliminar cualquier cosa que no sea un número
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      }}
                    />
                  </div>


                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary">
                      Guardar Cliente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;