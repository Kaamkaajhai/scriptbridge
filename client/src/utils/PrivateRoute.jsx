import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#eef0f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "investor" && user?.approvalStatus === "pending") {
    return <Navigate to="/?investorReview=pending" replace />;
  }

  if (user?.role === "investor" && user?.approvalStatus === "rejected") {
    return <Navigate to="/?investorReview=rejected" replace />;
  }

  if (!user) {
    const pathname = String(location.pathname || "");
    const profileMatch = pathname.match(/^\/profile\/([^/?#]+)/i);
    if (profileMatch?.[1]) {
      return <Navigate to={`/share/profile/${profileMatch[1]}${location.search}${location.hash}`} replace />;
    }

    const scriptMatch = pathname.match(/^\/script\/([^/?#]+)/i);
    if (scriptMatch?.[1]) {
      return <Navigate to={`/share/project/${scriptMatch[1]}${location.search}${location.hash}`} replace />;
    }
  }

  const destination = `${location.pathname}${location.search}${location.hash}`;
  return user ? children : <Navigate to="/login" replace state={{ from: destination }} />;
};

export default PrivateRoute;
