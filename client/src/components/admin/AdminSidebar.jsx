import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import {
  LayoutDashboard,
  CalendarDays,
  FileBarChart,
  Truck,
  Car,
  Users,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Settings,
  ChevronsUpDown,
  PanelLeft,
  LogOut,
} from 'lucide-react';
import favicon from '../../assets/images/favicon.png';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Calendar Schedule', icon: CalendarDays, path: '/admin/calendar' },
      { name: 'Reports', icon: FileBarChart, path: '/admin/reports' },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        name: 'Active Trips',
        icon: Truck,
        path: '/admin/trips',
        children: [
          { name: 'Ongoing', path: '/admin/trips/ongoing' },
          { name: 'Completed', path: '/admin/trips/completed' },
        ],
      },
      { name: 'Vehicles', icon: Car, path: '/admin/vehicles' },
      { name: 'Drivers', icon: UserCheck, path: '/admin/drivers' },
    ],
  },
  {
    label: 'Team',
    items: [
      { name: 'Members', icon: Users, path: '/admin/members' },
      { name: 'Approvals', icon: ShieldCheck, path: '/admin/approvals' },
    ],
  },
];

function AdminSidebar({ collapsed, onToggle, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.name || user?.email?.split('@')[0] || 'Admin User';
  const userEmail = user?.email || 'admin@logitrack.com';
  const userInitial = user?.firstName 
    ? user.firstName.charAt(0).toUpperCase() 
    : userName.charAt(0).toUpperCase();

  const toggleExpand = (itemName) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isGroupActive = (item) => {
    if (isActive(item.path)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.path));
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  if (collapsed) {
    return (
      <aside className="fixed top-0 left-0 z-40 flex h-screen w-14 md:w-[60px] flex-col border-r bg-sidebar border-sidebar-border">
        {/* Collapsed toggle */}
        <div className="flex h-11 md:h-12 items-center justify-center border-b border-sidebar-border">
          <button
            onClick={onToggle}
            className="flex h-7 w-7 md:h-[30px] md:w-[30px] items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4 md:h-[18px] md:w-[18px]" />
          </button>
        </div>

        {/* Collapsed nav icons */}
        <nav className="flex-1 overflow-y-auto py-2 md:py-2.5">
          <div className="flex flex-col items-center gap-1 md:gap-1.5">
            {navGroups.flatMap((group) =>
              group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.path)}
                    title={item.name}
                    className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded transition-colors ${isGroupActive(item)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" />
                  </button>
                );
              })
            )}
          </div>
        </nav>

        {/* Collapsed user avatar */}
        <div className="border-t border-sidebar-border p-2 md:p-2.5 flex justify-center">
          <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-sidebar-primary text-[10px] md:text-[11px] font-semibold text-white">
            {userInitial}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-[240px] md:w-[260px] flex-col border-r bg-sidebar border-sidebar-border">
      {/* Header / Branding / Toggle */}
      <div className="flex h-11 md:h-12 items-center border-b border-sidebar-border px-3 md:px-[14px]">
        <div className="flex items-center gap-2.5 md:gap-[11px] flex-1 overflow-hidden">
          <img src={favicon} alt="LogiTrack Logo" className="h-6 w-6 md:h-[26px] md:w-[26px] shrink-0 object-contain" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs md:text-[13px] font-semibold text-sidebar-foreground leading-tight truncate">
              LogiTrack
            </span>
            <span className="text-[10px] md:text-[11px] text-sidebar-muted-foreground leading-tight truncate">
              Logistic Department
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 md:h-[30px] md:w-[30px] shrink-0 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ml-2"
          title="Collapse sidebar"
        >
          <PanelLeft className="h-4 w-4 md:h-[18px] md:w-[18px]" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 md:px-[11px] pb-2 pt-3 md:pt-[14px]">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3 md:mb-[14px]">
            <span className="mb-1 block px-1.5 md:px-[7px] text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
              {group.label}
            </span>
            <ul className="space-y-px md:space-y-[1px]">
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems[item.name];
                const active = isGroupActive(item);

                return (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleExpand(item.name);
                        } else {
                          handleNavClick(item.path);
                        }
                      }}
                      className={`group flex w-full items-center gap-2.5 md:gap-[11px] rounded px-1.5 md:px-[7px] py-1.5 md:py-[7px] text-xs md:text-[13px] font-medium transition-colors ${active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5 md:h-[15px] md:w-[15px] shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {hasChildren && (
                        <span className="ml-auto">
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 md:h-[15px] md:w-[15px] text-sidebar-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 md:h-[15px] md:w-[15px] text-sidebar-muted-foreground" />
                          )}
                        </span>
                      )}
                    </button>

                    {/* Sub-items */}
                    {hasChildren && isExpanded && (
                      <ul className="ml-5 md:ml-[22px] mt-px md:mt-[1px] space-y-px border-l border-sidebar-border pl-2.5 md:pl-3">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <button
                              onClick={() => handleNavClick(child.path)}
                              className={`flex w-full items-center rounded px-1.5 md:px-[7px] py-1 md:py-[5px] text-xs md:text-[13px] transition-colors ${isActive(child.path)
                                  ? 'font-medium text-sidebar-accent-foreground bg-sidebar-accent'
                                  : 'text-sidebar-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                                }`}
                            >
                              {child.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="relative border-t border-sidebar-border p-2 md:p-[10px]">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex w-full items-center gap-2.5 md:gap-[11px] rounded px-1.5 md:px-[7px] py-1.5 md:py-[7px] transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[10px] md:text-[11px] font-semibold text-white">
            {userInitial}
          </div>
          <div className="flex flex-1 flex-col text-left overflow-hidden">
            <span className="text-xs md:text-[13px] font-medium text-sidebar-foreground leading-tight truncate">
              {userName}
            </span>
            <span className="text-[10px] md:text-[11px] text-sidebar-muted-foreground leading-tight truncate">
              {userEmail}
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 md:h-[15px] md:w-[15px] text-sidebar-muted-foreground shrink-0" />
        </button>

        {/* Dropdown menu */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 rounded border border-sidebar-border bg-white py-0.5 shadow-lg">
            <button
              onClick={() => {
                setUserMenuOpen(false);
                navigate('/admin/settings');
              }}
              className="flex w-full items-center gap-2 px-2.5 md:px-[11px] py-1.5 md:py-[7px] text-xs md:text-[13px] text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Settings className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" />
              Settings
            </button>
            <div className="my-0.5 border-t border-sidebar-border" />
            <button
              onClick={() => {
                setUserMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 px-2.5 md:px-[11px] py-1.5 md:py-[7px] text-xs md:text-[13px] text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default AdminSidebar;
