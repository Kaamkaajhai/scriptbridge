import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import ScriptUpload from "./pages/ScriptUpload";
import Search from "./pages/Search";
import ScriptDetail from "./pages/ScriptDetail";
import TopList from "./pages/TopList";
import FeaturedProjects from "./pages/FeaturedProjects";
import MainLayout from "./layouts/MainLayout";
import PrivateRoute from "./utils/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/top-list"
            element={
              <PrivateRoute>
                <MainLayout>
                  <TopList />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/featured"
            element={
              <PrivateRoute>
                <MainLayout>
                  <FeaturedProjects />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:id?"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <MainLayout>
                  <ScriptUpload />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Search />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/script/:id"
            element={
              <PrivateRoute>
                <MainLayout>
                  <ScriptDetail />
                </MainLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

