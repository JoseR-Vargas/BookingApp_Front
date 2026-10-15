import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';

/**
 * Route guard for the admin panel. The legacy page redirected to login.html when the
 * `isAdmin` session flag was missing; here the visitor is sent to /login instead.
 * `replace` keeps the guarded URL out of the history, so Back does not bounce the user around.
 */
export default function RequireAuth({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
