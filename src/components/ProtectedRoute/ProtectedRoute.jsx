import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
