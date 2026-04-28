import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CitizenLogin from './pages/CitizenLogin';
import CitizenRegister from './pages/CitizenRegister';
import CitizenForgotPassword from './pages/CitizenForgotPassword';
import OfficerPortal from './pages/OfficerPortal';
import OfficerForgotPassword from './pages/OfficerForgotPassword';
import OfficerResetPassword from './pages/OfficerResetPassword';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackTicket from './pages/TrackTicket';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AppContent() {
  const location = useLocation();
  const hideNavbarPaths = ['/citizen/login', '/citizen/register', '/citizen/forgot-password', '/officer/login', '/officer/register', '/officer/forgot-password', '/officer/reset-password'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Citizen Portal */}
        <Route path="/citizen/login" element={<CitizenLogin />} />
        <Route path="/citizen/register" element={<CitizenRegister />} />
        <Route path="/citizen/forgot-password" element={<CitizenForgotPassword />} />

        {/* Officer Portal (Unified) */}
        <Route path="/officer/login" element={<OfficerPortal />} />
        <Route path="/officer/register" element={<OfficerPortal />} />
        <Route path="/officer/forgot-password" element={<OfficerForgotPassword />} />
        <Route path="/officer/reset-password" element={<OfficerResetPassword />} />

        {/* Legacy Redirects */}
        <Route path="/login" element={<Navigate to="/citizen/login" replace />} />
        <Route path="/register" element={<Navigate to="/citizen/register" replace />} />

        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/officer" element={<OfficerDashboard />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/complaint" element={<Navigate to="/submit" replace />} />
        <Route path="/track" element={<TrackTicket />} />
        <Route path="/track-grievance" element={<Navigate to="/track" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  const content = (
    <Router>
      <AppContent />
    </Router>
  );

  return clientId ? (
    <GoogleOAuthProvider clientId={clientId}>
      {content}
    </GoogleOAuthProvider>
  ) : content;
}

export default App;

