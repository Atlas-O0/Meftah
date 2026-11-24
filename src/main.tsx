import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/vazirmatn';
import './styles.css';
import App from './App';
import { initDataSource } from './lib/bootstrap';

const root = createRoot(document.getElementById('root')!);

async function start() {
  root.render(
    <div style={{ padding: 32, fontFamily: 'Vazirmatn, sans-serif', color: '#5b6475' }}>در حال بارگذاری…</div>,
  );
  await initDataSource();
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void start();
