// src/App.jsx
import { useState, useEffect } from 'react';
import { AdminProvider } from './context/AdminContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Cronograma from './components/Cronograma';
import Instituciones from './components/Instituciones';
import Footer from './components/Footer';
import Agenda from './pages/Agenda';
import Escenarios from './pages/Escenarios';
import EscenarioDetalle from './pages/EscenarioDetalle';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSesiones from './pages/AdminSesiones';
import AdminRegistrarSesion from './pages/AdminRegistrarSesion';
import AdminUsuarios from './pages/AdminUsuarios';
import AdminEscenarios from './pages/AdminEscenarios';
import MiAgenda from './pages/MiAgenda';
import CronogramaEstudiante from './pages/CronogramaEstudiante';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminReportes from './pages/AdminReportes';
import AdminPdfViewer from './pages/AdminPdfViewer';
import AgendaPdfViewer from './pages/AgendaPdfViewer';
import Ponentes from './pages/Ponentes';
import ConfirmarAsistencia from './pages/ConfirmarAsistencia';
import AdminQR from './pages/AdminQR';
import ConstanciaPdf from './pages/ConstanciaPdf';
import VerificarConstancia from './pages/VerificarConstancia';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEscenario, setSelectedEscenario] = useState(null);

  const [confirmarSesionId, setConfirmarSesionId] = useState(null);
  const [verificarUid, setVerificarUid] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const confirmar = urlParams.get('confirmar');

    // QR de asistencia
    if (confirmar) {
      setConfirmarSesionId(confirmar);
      setCurrentPage('confirmarAsistencia');
      window.history.replaceState({}, '', '/');
      return;
    }

    // Verificación de constancia
    const verificar = urlParams.get('verificar');
    if (verificar && verificar !== 'undefined' && verificar !== 'null') {
      sessionStorage.setItem('verif_uid', verificar);
      setVerificarUid(verificar);
      setCurrentPage('verificarConstancia');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (token) {
      localStorage.setItem('resetToken', token);
      setCurrentPage('resetPassword');
      window.history.replaceState({}, '', '/');
    } else if (path === '/reset-password') {
      const savedToken = localStorage.getItem('resetToken');
      if (savedToken) setCurrentPage('resetPassword');
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    const pingNeon = async () => {
      try {
        await fetch('/api/ping');
      } catch (error) { }
    };
    pingNeon();
    const pingInterval = setInterval(pingNeon, 30 * 1000);
    return () => clearInterval(pingInterval);
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <><HeroSection /><Cronograma /><Instituciones /></>;
      case 'agenda':
        return <Agenda setCurrentPage={setCurrentPage} />;
      case 'escenarios':
        return <Escenarios setCurrentPage={setCurrentPage} setSelectedEscenario={setSelectedEscenario} />;
      case 'escenarioDetalle':
        return <EscenarioDetalle escenarioNombre={selectedEscenario} setCurrentPage={setCurrentPage} />;
      case 'loginPage':
        return <LoginPage setCurrentPage={setCurrentPage} />;
      case 'resetPassword':
        return <ResetPasswordPage setCurrentPage={setCurrentPage} />;
      case 'register':
        return <RegisterPage setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminDashboard setCurrentPage={setCurrentPage} />;
      case 'adminSesiones':
        return <AdminSesiones setCurrentPage={setCurrentPage} />;
      case 'adminRegistrarSesion':
        return <AdminRegistrarSesion setCurrentPage={setCurrentPage} />;
      case 'adminUsuarios':
        return <AdminUsuarios setCurrentPage={setCurrentPage} />;
      case 'adminEscenarios':
        return <AdminEscenarios setCurrentPage={setCurrentPage} />;
      case 'adminReportes':
        return <AdminReportes setCurrentPage={setCurrentPage} />;
      case 'adminPdfViewer':
        return <AdminPdfViewer setCurrentPage={setCurrentPage} />;
      case 'agendaPdf':
        return <AgendaPdfViewer setCurrentPage={setCurrentPage} />;
      case 'miAgenda':
        return <MiAgenda setCurrentPage={setCurrentPage} />;
      case 'cronogramaEstudiante':
        return <CronogramaEstudiante setCurrentPage={setCurrentPage} />;
      case 'ponentes':
        return <Ponentes setCurrentPage={setCurrentPage} />;
      case 'confirmarAsistencia':
        return <ConfirmarAsistencia setCurrentPage={setCurrentPage} sesionId={confirmarSesionId} />;
      case 'adminQR':
        return <AdminQR setCurrentPage={setCurrentPage} />;
      case 'constanciaPdf':
        return <ConstanciaPdf setCurrentPage={setCurrentPage} />;
      case 'verificarConstancia':
        return <VerificarConstancia uid={verificarUid} />;
      default:
        return <><HeroSection /><Cronograma /><Instituciones /></>;
    }
  };

  // ✅ AGREGAR miAgenda y cronogramaEstudiante aquí
  const isAdminPage = currentPage === 'admin' ||
    currentPage === 'adminSesiones' ||
    currentPage === 'adminRegistrarSesion' ||
    currentPage === 'adminUsuarios' ||
    currentPage === 'adminEscenarios' ||
    currentPage === 'adminReportes' ||
    currentPage === 'adminPdfViewer' ||
    currentPage === 'loginPage' ||
    currentPage === 'register' ||
    currentPage === 'miAgenda' ||
    currentPage === 'cronogramaEstudiante' ||
    currentPage === 'agendaPdf' ||
    currentPage === 'confirmarAsistencia' ||
    currentPage === 'adminQR' ||
    currentPage === 'constanciaPdf' ||
    currentPage === 'verificarConstancia';

  return (
    <AdminProvider>
      <div className="bg-gray-100 dark:bg-gray-950 transition-colors duration-300 min-h-screen">
        {!isAdminPage && <Navbar toggleTheme={toggleTheme} theme={theme} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
        {renderPage()}
        {!isAdminPage && <Footer />}
      </div>
    </AdminProvider>
  );
}

export default App;