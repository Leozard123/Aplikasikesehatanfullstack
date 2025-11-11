import { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { LoginPage } from './components/LoginPage';
import { DokterDashboard } from './components/DokterDashboard';
import { PasienDashboard } from './components/PasienDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAccessToken(session.access_token);
        setUserRole(session.user.user_metadata?.role || 'pasien');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string, role: string) => {
    setAccessToken(token);
    setUserRole(role);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUserRole(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Render dashboard based on role
  switch (userRole) {
    case 'dokter':
      return <DokterDashboard accessToken={accessToken} onLogout={handleLogout} />;
    case 'pasien':
      return <PasienDashboard accessToken={accessToken} onLogout={handleLogout} />;
    case 'admin':
      return <AdminDashboard accessToken={accessToken} onLogout={handleLogout} />;
    default:
      return <LoginPage onLogin={handleLogin} />;
  }
}
