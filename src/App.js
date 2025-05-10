import { Routes, Route, Navigate } from 'react-router-dom';
import POS from './Pos'; // Pantalla principal
import Home from './home'; // Otra vista
import Historial from './historial';

function App() {
  return (
    <Routes>
      {/* Redirección desde la raíz "/" a "/Pos" */}
      <Route path="/" element={<Navigate to="/Pos" />} />

      {/* Vistas reales */}
      <Route path="/Pos" element={<POS />} />
      <Route path="/home" element={<Home />} />
      <Route path="/historial" element={<Historial/>} />
    </Routes>
  );
}

export default App;
