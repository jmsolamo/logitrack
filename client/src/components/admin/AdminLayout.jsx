import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { Menu, User as UserIcon } from 'lucide-react';
import favicon from '../../assets/images/favicon.png';

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data && data.role === 'admin') {
          setIsAdmin(true);
          setUser(data);
        } else {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background print:block print:!h-auto print:!bg-white">
      {/* Sidebar — hidden when printing */}
      <div className="print:hidden">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-[56px]' : 'md:ml-[235px]'
          } print:!ml-0`}
      >
        {/* Top bar — hidden when printing */}
        <header className="sticky top-0 z-30 flex h-11 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-5 print:hidden">
          <div className="flex items-center gap-2.5">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex md:hidden h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

          </div>


        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 print:!p-0 print:!overflow-visible">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
