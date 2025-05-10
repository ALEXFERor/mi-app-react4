import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function Boleta({ venta, total, metodoPago, entregado, vuelto }) {
  const boletaPDFRef = useRef(null);

  const descargarPDF = () => {
    const input = boletaPDFRef.current;
  
    html2canvas(input, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
  
      const imgWidth = 80; // Ancho en mm (más estrecho para formato ticket)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      const pdf = new jsPDF('p', 'mm', [imgWidth + 20, imgHeight + 20]); // Ajuste dinámico con márgenes
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`boleta_${venta.num_serie || new Date().toISOString().slice(0, 10)}.pdf`);

    });
  };

  const fecha = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div>
      <button onClick={descargarPDF} className="btn btn-success mt-1 mb-2">Descargar Boleta PDF</button>
      <div ref={boletaPDFRef} style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        width: '420px',
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        margin: '0 auto'
      }}>
        
        {/* ENCABEZADO */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>TIENDA DE ELECTRÓNICA</h2>
          <p>Av. Principal 123 - Lima</p>
          <p><strong>DNI:</strong> {venta.cliente_dni}</p>
        </div>

        <hr style={{ borderTop: '1px dashed #aaa' }} />

        {/* DATOS DE LA BOLETA */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <strong>BOLETA ELECTRÓNICA</strong>
          <p>N° {venta.num_serie || 'SN'}</p>
        </div>

        {/* CLIENTE Y FECHA */}
        <div style={{ marginBottom: '10px' }}>
          <p><strong>Fecha:</strong> {fecha}</p>
          <p><strong>Cliente:</strong> {venta.cliente_nombre}</p>
          <p><strong>Teléfono:</strong> {venta.cliente_telefono}</p>
        </div>

        <hr style={{ borderTop: '1px dashed #aaa' }} />

        {/* DETALLE DE PRODUCTOS */}
        <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f1f1' }}>
              <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid #ccc' }}>Descripción</th>
              <th style={{ textAlign: 'center', padding: '4px', borderBottom: '1px solid #ccc' }}>Cant</th>
              <th style={{ textAlign: 'right', padding: '4px', borderBottom: '1px solid #ccc' }}>P.U.</th>
              <th style={{ textAlign: 'right', padding: '4px', borderBottom: '1px solid #ccc' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venta.productos.map((p, index) => (
              <tr key={index}>
                <td style={{ padding: '4px' }}>{p.nombre}</td>
                <td style={{ textAlign: 'center', padding: '4px' }}>{p.cantidad}</td>
                <td style={{ textAlign: 'right', padding: '4px' }}>S/ {p.precio.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '4px' }}>S/ {p.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ borderTop: '1px dashed #aaa' }} />

        {/* TOTALES */}
        <div style={{ textAlign: 'right' }}>
          <p><strong>Total:</strong> S/ {parseFloat(total).toFixed(2)}</p>
          <p><strong>Método de Pago:</strong> {metodoPago}</p>
          <p><strong>Entregado:</strong> S/ {parseFloat(entregado || 0).toFixed(2)}</p>
          <p><strong>Vuelto:</strong> S/ {parseFloat(vuelto || 0).toFixed(2)}</p>
        </div>

        <hr style={{ borderTop: '1px dashed #aaa' }} />

        {/* PIE DE PÁGINA */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <p>Gracias por su compra</p>
          <p style={{ fontSize: '11px', color: '#777' }}>
            Representación impresa de la boleta electrónica
          </p>
        </div>
      </div>
    </div>
  );
}

export default Boleta;
