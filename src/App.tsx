import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">SIAF</div>
        <nav>
          <Link to="/kategori">Kategori</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
