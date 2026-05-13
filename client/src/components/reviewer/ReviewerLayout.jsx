import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  CalendarDays,
  Truck,
  ClipboardList,
  FileText,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import AnnouncementModal from '../ui/announcement-modal';
import favicon from '../../assets/images/favicon.png';

const reviewerNavItems = [
  { name: 'Dashboard', path: '/reviewer/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', path: '/reviewer/calendar', icon: CalendarDays },
  { name: 'Deliveries', path: '/reviewer/deliveries', icon: Truck },
  { name: 'Review Deliveries', path: '/reviewer/requests', icon: ClipboardList },
  { name: 'Job Orders', path: '/reviewer/job-orders', icon: FileText },
];

export default function ReviewerLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkReviewerRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const { data } = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data && data.role === 'manager') {
          setUser(data);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error verifying reviewer role:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkReviewerRole();
  }, [navigate]);

  // Fetch announcements on layout mount
  useEffect(() => {
    if (user) {
      const fetchAnnouncements = async () => {
        try {
          const token = localStorage.getItem('token');
          const { data } = await axios.get('/api/announcements', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data && data.length > 0) {
            setAnnouncements(data);

            // Show announcement modal only once per login session
            if (!sessionStorage.getItem('announcementShownThisSession')) {
              setShowAnnouncementModal(true);
              sessionStorage.setItem('announcementShownThisSession', 'true');
            }
          }
        } catch (error) {
          console.error('Error fetching announcements:', error);
        }
      };

      fetchAnnouncements();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading reviewer portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 print:hidden">
        <div className="flex items-center gap-6 md:gap-10 h-full">
          <div className="flex items-center gap-2 shrink-0">
            <img src={favicon} alt="LogiTrack Logo" className="h-6 w-6 object-contain" />
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[13px] font-bold text-foreground leading-tight tracking-tight">LogiTrack</span>
              <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight uppercase tracking-wide">ENERTECH SYSTEMS INDUSTRIES INC.</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 h-full">
            {reviewerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative flex items-center justify-center h-full gap-1.5 px-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <nav className="flex md:hidden items-center gap-4 h-full ml-4">
            {reviewerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative flex items-center justify-center h-full gap-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative shrink-0 pr-1 sm:pr-2">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity p-1.5 rounded-md hover:bg-muted"
            title="Profile"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-[12px] font-medium leading-none text-foreground">
                {user?.username || 'Reviewer'}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none mt-1 capitalize">
                {user?.role || 'Reviewer'}
              </span>
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 rounded-md border border-border bg-popover py-1 shadow-lg animate-in fade-in zoom-in-95">
                <Link
                  to="/reviewer/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('announcementShownThisSession');
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 relative">
        <div className="h-full w-full">
          <Outlet context={{ user }} />
        </div>
      </main>

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        announcements={announcements}
        onClose={() => setShowAnnouncementModal(false)}
      />
    </div>
  );
}
