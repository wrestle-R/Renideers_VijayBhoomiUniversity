import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { LoadingPage } from "./components/LoadingPage";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profiles from "./pages/Dashboard/Profiles";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <LoadingPage />;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/profiles" 
        element={
          <ProtectedRoute>
            <Profiles />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" />
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
