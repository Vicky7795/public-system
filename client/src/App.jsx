import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CitizenLogin from './pages/CitizenLogin';
import CitizenRegister from './pages/CitizenRegister';
import CitizenForgotPassword from './pages/CitizenForgotPassword';
import OfficerLogin from './pages/OfficerLogin';
import OfficerRegister from './pages/OfficerRegister';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import Departments from './pages/Departments';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackTicket from './pages/TrackTicket';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Citizen Portal */}
          <Route path="/citizen/login" element={<CitizenLogin />} />
          <Route path="/citizen/register" element={<CitizenRegister />} />
          <Route path="/citizen/forgot-password" element={<CitizenForgotPassword />} />

          {/* Officer Portal */}
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route path="/officer/register" element={<OfficerRegister />} />

          {/* Legacy Redirects */}
          <Route path="/login" element={<Navigate to="/citizen/login" replace />} />
          <Route path="/register" element={<Navigate to="/citizen/register" replace />} />

          <Route path="/dashboard" element={<CitizenDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/departments" element={<Departments />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/track" element={<TrackTicket />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
