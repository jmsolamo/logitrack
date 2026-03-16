import { useState, useEffect } from 'react';
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
  Receipt,
  Map,
  ClipboardList,
  MapPin,
  Banknote,
  ShoppingCart,
  X,
} from 'lucide-react';
import favicon from '../../assets/images/favicon.png';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Delivery Plan', icon: Map, path: '/admin/delivery-plan' },
      {
        name: 'Delivery Expenses',
        icon: Receipt,
        path: '/admin/delivery-expenses',
        children: [
          { name: 'Actual Expenses', path: '/admin/delivery-expenses/actual' },
          { name: 'Diesel', path: '/admin/delivery-expenses/diesel' },
          { name: 'Expenses Breakdown', path: '/admin/delivery-expenses/breakdown' },
          { name: 'Job Orders', path: '/admin/delivery-expenses/job-orders' },
        ],
      },
      { name: 'Purchases', icon: ShoppingCart, path: '/admin/purchases' },
      { name: 'Calendar', icon: CalendarDays, path: '/admin/calendar' },
      { name: 'Request', icon: ClipboardList, path: '/admin/request' },
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
      },
      { name: 'Destinations', icon: MapPin, path: '/admin/destinations' },
      { name: 'Delivery Charge', icon: Banknote, path: '/admin/delivery-charge' },
      { name: 'Vehicles', icon: Car, path: '/admin/vehicles' },
      { name: 'Personnels', icon: UserCheck, path: '/admin/personnels' },
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

function AdminSidebar({ collapsed, onToggle, user, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

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
    // Close mobile sidebar on navigation
    if (onMobileClose) onMobileClose();
  };

  // --- Collapsed desktop sidebar ---
  if (collapsed) {
    return (
      <>
        {/* Mobile overlay sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 transition-opacity"
              onClick={onMobileClose}
            />
            {/* Sidebar panel */}
            <aside className="absolute top-0 left-0 flex h-full w-[270px] flex-col border-r bg-sidebar border-sidebar-border shadow-xl">
              <MobileSidebarContent
                onMobileClose={onMobileClose}
                navGroups={navGroups}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                isActive={isActive}
                isGroupActive={isGroupActive}
                handleNavClick={handleNavClick}
                userInitial={userInitial}
                userName={userName}
                userEmail={userEmail}
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                handleLogout={handleLogout}
                navigate={navigate}
                favicon={favicon}
              />
            </aside>
          </div>
        )}

        {/* Desktop collapsed sidebar */}
        <aside className="fixed top-0 left-0 z-40 hidden md:flex h-screen w-[56px] flex-col border-r bg-sidebar border-sidebar-border">
          {/* Collapsed toggle */}
          <div className="flex h-11 items-center justify-center border-b border-sidebar-border">
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Collapsed nav icons */}
          <nav className="flex-1 overflow-y-auto py-2">
            <div className="flex flex-col items-center gap-1">
              {navGroups.flatMap((group) =>
                group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.children && item.children.length > 0) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          if (activeMenu?.name === item.name) {
                            setActiveMenu(null);
                          } else {
                            setActiveMenu({
                              name: item.name,
                              items: item.children,
                              x: rect.right + 12,
                              y: rect.top,
                            });
                          }
                        } else {
                          handleNavClick(item.path);
                          setActiveMenu(null);
                        }
                      }}
                      title={!item.children || item.children.length === 0 ? item.name : undefined}
                      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${isGroupActive(item)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })
              )}
            </div>
          </nav>

          {/* Collapsed user avatar */}
          <div className="border-t border-sidebar-border p-2 flex justify-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-semibold text-white">
              {userInitial}
            </div>
          </div>
        </aside>

        {/* Floating Menu for Collapsed Sidebar */}
        {activeMenu && (
          <div
            className="fixed z-50 w-48 rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md outline-none animate-in fade-in zoom-in-95"
            style={{ top: activeMenu.y, left: activeMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-[11px] font-semibold border-b border-sidebar-border text-sidebar-foreground">
              {activeMenu.name}
            </div>
            <div className="p-1 flex flex-col gap-0.5">
              {activeMenu.items.map(child => (
                <button
                  key={child.name}
                  onClick={() => {
                    handleNavClick(child.path);
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors ${isActive(child.path)
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // --- Expanded desktop sidebar ---
  return (
    <>
      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={onMobileClose}
          />
          {/* Sidebar panel */}
          <aside className="absolute top-0 left-0 flex h-full w-[270px] flex-col border-r bg-sidebar border-sidebar-border shadow-xl">
            <MobileSidebarContent
              onMobileClose={onMobileClose}
              navGroups={navGroups}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              isActive={isActive}
              isGroupActive={isGroupActive}
              handleNavClick={handleNavClick}
              userInitial={userInitial}
              userName={userName}
              userEmail={userEmail}
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              handleLogout={handleLogout}
              navigate={navigate}
              favicon={favicon}
            />
          </aside>
        </div>
      )}

      {/* Desktop expanded sidebar */}
      <aside className="fixed top-0 left-0 z-40 hidden md:flex h-screen w-[235px] flex-col border-r bg-sidebar border-sidebar-border">
        {/* Header / Branding / Toggle */}
        <div className="flex h-11 items-center border-b border-sidebar-border px-3">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <img src={favicon} alt="LogiTrack Logo" className="h-5 w-5 shrink-0 object-contain" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-semibold text-sidebar-foreground leading-tight truncate">
                LogiTrack
              </span>
              <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
                Logistic Department
              </span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ml-1"
            title="Collapse sidebar"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2.5">
              <span className="mb-1 block px-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
                {group.label}
              </span>
              <ul className="space-y-px">
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
                        className={`group flex w-full items-center gap-2 rounded px-1.5 py-1 text-[12px] font-medium transition-colors ${active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {hasChildren && (
                          <span className="ml-auto">
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 text-sidebar-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-sidebar-muted-foreground" />
                            )}
                          </span>
                        )}
                      </button>

                      {/* Sub-items */}
                      {hasChildren && isExpanded && (
                        <ul className="ml-4 mt-px space-y-px border-l border-sidebar-border pl-2">
                          {item.children.map((child) => (
                            <li key={child.name}>
                              <button
                                onClick={() => handleNavClick(child.path)}
                                className={`flex w-full items-center rounded px-1.5 py-1 text-[11px] transition-colors ${isActive(child.path)
                                  ? 'font-medium text-primary-foreground bg-primary'
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
        <div className="relative border-t border-sidebar-border p-2">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-semibold text-white">
              {userInitial}
            </div>
            <div className="flex flex-1 flex-col text-left overflow-hidden">
              <span className="text-[12px] font-medium text-sidebar-foreground leading-tight truncate">
                {userName}
              </span>
              <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
                {userEmail}
              </span>
            </div>
            <ChevronsUpDown className="h-3 w-3 text-sidebar-muted-foreground shrink-0" />
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
    </>
  );
}

// --- Shared mobile sidebar content (used in both collapsed and expanded states) ---
function MobileSidebarContent({
  onMobileClose,
  navGroups,
  expandedItems,
  toggleExpand,
  isActive,
  isGroupActive,
  handleNavClick,
  userInitial,
  userName,
  userEmail,
  userMenuOpen,
  setUserMenuOpen,
  handleLogout,
  navigate,
  favicon,
}) {
  return (
    <>
      {/* Mobile header */}
      <div className="flex h-11 items-center border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <img src={favicon} alt="LogiTrack Logo" className="h-5 w-5 shrink-0 object-contain" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-[12px] font-semibold text-sidebar-foreground leading-tight truncate">
              LogiTrack
            </span>
            <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
              Logistic Department
            </span>
          </div>
        </div>
        <button
          onClick={onMobileClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ml-1"
          title="Close sidebar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mobile navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2.5">
            <span className="mb-1 block px-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
              {group.label}
            </span>
            <ul className="space-y-px">
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
                      className={`group flex w-full items-center gap-2 rounded px-1.5 py-1 text-[12px] font-medium transition-colors ${active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {hasChildren && (
                        <span className="ml-auto">
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 text-sidebar-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-sidebar-muted-foreground" />
                          )}
                        </span>
                      )}
                    </button>

                    {hasChildren && isExpanded && (
                      <ul className="ml-4 mt-px space-y-px border-l border-sidebar-border pl-2">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <button
                              onClick={() => handleNavClick(child.path)}
                              className={`flex w-full items-center rounded px-1.5 py-1 text-[11px] transition-colors ${isActive(child.path)
                                ? 'font-medium text-primary-foreground bg-primary'
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

      {/* Mobile user footer */}
      <div className="relative border-t border-sidebar-border p-2">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-semibold text-white">
            {userInitial}
          </div>
          <div className="flex flex-1 flex-col text-left overflow-hidden">
            <span className="text-[12px] font-medium text-sidebar-foreground leading-tight truncate">
              {userName}
            </span>
            <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
              {userEmail}
            </span>
          </div>
          <ChevronsUpDown className="h-3 w-3 text-sidebar-muted-foreground shrink-0" />
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 rounded border border-sidebar-border bg-white py-0.5 shadow-lg">
            <button
              onClick={() => {
                setUserMenuOpen(false);
                navigate('/admin/settings');
                onMobileClose();
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
            <div className="my-0.5 border-t border-sidebar-border" />
            <button
              onClick={() => {
                setUserMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminSidebar;
