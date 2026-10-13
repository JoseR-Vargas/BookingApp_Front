import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />

      {/* Legacy static URLs keep working (bookmarks, links shared before the migration). */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
