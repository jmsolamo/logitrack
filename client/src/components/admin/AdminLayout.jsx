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
            <div className="hidden sm:flex items-center gap-2">
              <img src={favicon} alt="LogiTrack Logo" className="h-5 w-5 shrink-0 object-contain" />
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">LogiTrack</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">ENERTECH SYSTEMS INDUSTRIES INC.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Profile */}
            <button
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              title="Profile"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-[12px] font-medium leading-none text-foreground">
                  {user?.username || 'Admin User'}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-1 capitalize">
                  {user?.role === 'admin' ? 'Administrator' : user?.role || 'Admin'}
                </span>
              </div>
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
