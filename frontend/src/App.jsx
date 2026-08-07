import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavouritesProvider } from './context/FavouritesContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollManager from './components/ScrollManager';

import Home from './pages/Home';
import Login from './pages/Login';
import Listings from './pages/Listings';
import PropertyDetail from './pages/PropertyDetail';
import Favourites from './pages/Favourites';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
import SubscriptionCallback from './pages/SubscriptionCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollManager />
        <AuthProvider>
          <FavouritesProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login initialMode="login" />} />
            <Route path="/register" element={<Login initialMode="register" />} />
            <Route
              path="/listings"
              element={
                <ProtectedRoute allowedRoles={['buyer', 'agent', 'admin']}>
                  <Listings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute allowedRoles={['buyer', 'agent', 'admin']}>
                  <PropertyDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/subscription/callback" element={<SubscriptionCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['buyer', 'agent', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agent/dashboard"
              element={<Navigate to="/profile" replace />}
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
          </FavouritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
