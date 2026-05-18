import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const isExpired = decodedToken?.exp && decodedToken.exp * 1000 <= Date.now();

    if (isExpired) {
      localStorage.removeItem("token");
      return <Navigate to="/auth" replace state={{ from: location }} />;
    }
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
