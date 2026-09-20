import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  isAdmin: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAdmin, children }) => {
  if (!isAdmin) {
    // En v6 se usa Navigate en lugar de Redirect
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;