import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/vazirmatn';
import './styles.css';
import App from './App';
import { initDataSource } from './lib/bootstrap';

const root = createRoot(document.getElementById('root')!);

async function start() {
  root.render(
    <div className="boot">
      <div className="brand-mark">م</div>
      <div className="boot-text">در حال بارگذاری…</div>
      <div className="boot-bar">
        <span />
      </div>
    </div>,
  );
  await initDataSource();
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void start();
