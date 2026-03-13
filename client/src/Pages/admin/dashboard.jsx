import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../config/firebase';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const { data } = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data && data.role === 'admin') {
          setIsAdmin(true);
        } else {
          // Redirect if not admin
          navigate('/login');
        }
      } catch (error) {
        console.error('Error verifying role:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen p-8 bg-white/10 backdrop-blur-sm text-white">
      <div className="max-w-4xl mx-auto bg-white/20 p-8 rounded-lg shadow-xl border border-white/30 text-center">
        <h1 className="text-4xl font-bold mb-4 text-orange-400">Login Success!</h1>
        <p className="text-xl mb-4">Welcome to the Admin Dashboard.</p>
        <p className="text-2xl mb-8 font-semibold">hello</p>
        
        <div className="p-6 bg-green-500/20 rounded-lg border border-green-500/50 mb-8">
          <p className="text-lg font-semibold text-green-300">
            ✓ Role confirmed: <span className="uppercase font-bold">Admin</span>
          </p>
        </div>

        <button 
          onClick={handleLogout}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
