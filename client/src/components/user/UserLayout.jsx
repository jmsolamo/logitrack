import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Sun, Moon, LayoutDashboard, CalendarDays, Truck, LogOut } from 'lucide-react';
import { auth } from '../../config/firebase';
import favicon from '../../assets/images/favicon.png';

function UserLayout() {
  const [loading, setLoading] = useState(true);
  const [isUser, setIsUser] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

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

        if (data && data.role === 'user') {
          setIsUser(true);
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isUser) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/user/calendar', icon: CalendarDays },
    { name: 'Deliveries', path: '/user/deliveries', icon: Truck },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-10">
          {/* Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <img src={favicon} alt="LogiTrack Logo" className="h-6 w-6 object-contain" />
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[13px] font-bold text-foreground leading-tight uppercase tracking-tight">LogiTrack</span>
              <span className="text-[9px] text-muted-foreground leading-tight uppercase tracking-widest">Logistic Dept</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{item.name}</span>
                  {/* Tooltip for mobile since text is hidden */}
                  <span className="sm:hidden">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors bg-accent/30"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5 border-l border-border pl-3 sm:pl-4">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] sm:text-[12px] font-semibold text-primary-foreground shadow-sm">
              {(user?.firstName || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col items-start pr-2">
              <span className="text-[12px] font-bold leading-none text-foreground uppercase tracking-tight">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-[9px] text-muted-foreground leading-none mt-1 uppercase tracking-widest">
                User Account
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 relative">
        <div className="mx-auto max-w-[1400px] h-full">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

export default UserLayout;
