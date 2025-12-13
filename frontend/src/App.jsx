import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { LoadingPage } from "./components/LoadingPage";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profiles from "./pages/Dashboard/Profiles";
import Explore from "./pages/Dashboard/Explore";
import Followers from "./pages/Dashboard/Followers";
import UserProfile from "./pages/UserProfile";

import NotFound from "./pages/NotFound";
import Requests from "./pages/Dashboard/Requests";
import TrekPhotoRecognition from "./pages/Dashboard/TrekPhotoRecognition";
import Treks from "./pages/Treks";
import TrekDetail from "./pages/TrekDetail";
import Clubs from "./pages/Dashboard/Clubs";
import ClubDetails from "./pages/Dashboard/ClubDetails";
import { AIChatbot } from "./components/AIChatbot";
import Badges from "./pages/Badges";
import ActivityDetail from "./pages/ActivityDetail";

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
        path="/trek-ai" 
        element={
          <ProtectedRoute>
            <TrekPhotoRecognition />
          </ProtectedRoute>
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
      <Route 
        path="/explore" 
        element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/followers" 
        element={
          <ProtectedRoute>
            <Followers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/requests" 
        element={
          <ProtectedRoute>
            <Requests />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/treks"
        element={
          <ProtectedRoute>
            <Treks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/treks/:id"
        element={
          <ProtectedRoute>
            <TrekDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/treks"
        element={
          <ProtectedRoute>
            <Treks />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/activity/:id" 
        element={
          <ProtectedRoute>
            <ActivityDetail />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/treks/:id"
        element={
          <ProtectedRoute>
            <TrekDetail />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/clubs" 
        element={
          <ProtectedRoute>
            <Clubs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clubs/:id" 
        element={
          <ProtectedRoute>
            <ClubDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/:username" 
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/badges" 
        element={
          <ProtectedRoute>
            <Badges />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Track page navigation by storing current path
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      const excludedPaths = ['/auth', '/'];
      if (!excludedPaths.includes(currentPath)) {
        localStorage.setItem('lastVisitedPage', currentPath);
      }
    };

    // Store initial page
    handleRouteChange();

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return (
    <UserProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" />
          <AIChatbot />
        </Router>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;
