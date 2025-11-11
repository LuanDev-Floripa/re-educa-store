/**
 * AdminRoute Component - RE-EDUCA Store
 * 
 * Componente de rota protegida para ?rea administrativa.
 * 
 * Funcionalidades:
 * - Verifica autentica??o
 * - Verifica se usu?rio ? admin
 * - Redireciona se n?o autorizado
 * - Loading state durante verifica??o
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do a ser protegido
 * @returns {JSX.Element|Navigate} Componente protegido ou redirecionamento
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Carregando">
          <span className="sr-only">Carregando...</span>
        </div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
