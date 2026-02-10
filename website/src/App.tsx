
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import authService from "./services/authService";
import { UserRole } from "./models/User";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const WriterDashboard = lazy(() => import("./pages/WriterDashboard"));
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/*" element={<PublicWebsite />} />
          <Route path="/writer/*" element={<WriterDashboard />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.EDITOR]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles: UserRole[] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const userRoles = await authService.getUserRoles();
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      setIsAuthenticated(hasRequiredRole);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default App;

