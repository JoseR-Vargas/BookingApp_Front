import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';

// The panel (charts + socket client) is only needed by the admin: keep it out of the public bundle.
const Admin = lazy(() => import('./pages/Admin.jsx'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={(
          <RequireAuth>
            <Suspense fallback={null}>
              <Admin />
            </Suspense>
          </RequireAuth>
        )}
      />

      {/* Legacy static URLs keep working (bookmarks, links shared before the migration). */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
