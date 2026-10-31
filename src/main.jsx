import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const universidades = [
    'UNMSM',
    'UNI',
    'UNFV',
    'UNDAC',
    'UNEVHAL'
  ];

  return (
    <main style={{
      fontFamily: 'Arial',
      textAlign: 'center',
      padding: '25px',
      background: '#eef3f9',
      minHeight: '100vh'
    }}>
      <h1 style={{color:'#12345a'}}>PREU PERÚ AI</h1>
      <h2>Preparación para el ingreso universitario</h2>

      {universidades.map((u) => (
        <button key={u} style={{
          display:'block',
          width:'100%',
          padding:'20px',
          margin:'12px 0',
          background:'#12345a',
          color:'white',
          borderRadius:'12px',
          fontSize:'18px'
        }}>
          {u}
        </button>
      ))}

      <p>Tu camino hacia la universidad comienza aquí.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
