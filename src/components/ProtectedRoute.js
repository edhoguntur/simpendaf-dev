import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { userData, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userData) {
    // Redirect ke login berdasarkan role yang diperlukan
    if (requiredRole === 'pimpinan') {
      return <Navigate to="/login-pimpinan" replace />;
    } else if (requiredRole === 'presenter') {
      return <Navigate to="/login-presenter" replace />;
    }
    return <Navigate to="/login-pimpinan" replace />;
  }

  if (userData.role !== requiredRole) {
    // Redirect ke dashboard sesuai role user
    if (userData.role === 'pimpinan') {
      return <Navigate to="/pimpinan/dashboard" replace />;
    } else if (userData.role === 'presenter') {
      return <Navigate to="/presenter/dashboard" replace />;
    }
    return <Navigate to="/login-pimpinan" replace />;
  }

  return children;
};

export default ProtectedRoute;
