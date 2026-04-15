import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  PanelLeft,
  X,
  User as UserIcon,
} from 'lucide-react';
import favicon from '../../assets/images/favicon.png';

const navGroups = [
  {
    label: 'Portal',
    items: [
      { name: 'Requests', icon: ClipboardList, path: '/reviewer/requests' },
    ],
  },
];

function ReviewerSidebar({ collapsed, onToggle, user, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userName = user?.username || 'Reviewer';
  const userSubtitle = user?.role || 'Reviewer';

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  if (collapsed) {
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 transition-opacity"
              onClick={onMobileClose}
            />
            <aside className="absolute top-0 left-0 flex h-full w-[270px] flex-col border-r-2 bg-sidebar border-border shadow-xl">
              <div className="flex h-11 items-center justify-between border-b border-sidebar-border px-3">
              <div className="flex items-center gap-2">
                <img src={favicon} alt="LogiTrack Logo" className="h-5 w-5 shrink-0 object-contain" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[12px] font-semibold text-sidebar-foreground leading-tight truncate">LogiTrack</span>
                  <span className="text-[8px] text-sidebar-muted-foreground uppercase tracking-wider leading-tight truncate">ENERTECH SYSTEMS INDUSTRIES INC.</span>
                </div>
              </div>
              <button
                onClick={onMobileClose}
                className="flex h-7 w-7 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                title="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
              <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-3">
                {navGroups.map((group) => (
                  <div key={group.label} className="mb-2.5">
                    <span className="mb-1 block px-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
                      {group.label}
                    </span>
                    <ul className="space-y-px">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.name}>
                            <button
                              onClick={() => handleNavClick(item.path)}
                              className={`group flex w-full items-center gap-2 rounded px-1.5 py-1 text-[12px] font-medium transition-colors ${isActive(item.path)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="flex-1 text-left">{item.name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
              <div className="border-t border-sidebar-border p-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-white">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-1 flex-col text-left overflow-hidden">
                    <span className="text-[12px] font-medium text-sidebar-foreground leading-tight truncate">
                      {userName}
                    </span>
                    <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
                      {userSubtitle}
                    </span>
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="mt-1 rounded border border-sidebar-border bg-white py-0.5 shadow-lg">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        <aside className="fixed top-0 left-0 z-40 hidden md:flex h-screen w-[56px] flex-col border-r-2 bg-sidebar border-border">
          <div className="flex h-11 items-center justify-center border-b border-sidebar-border">
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            <div className="flex flex-col items-center gap-1">
              {navGroups.flatMap((group) =>
                group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.path)}
                      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      title={item.name}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })
              )}
            </div>
          </nav>
          <div className="border-t border-sidebar-border p-2 flex justify-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-white">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={onMobileClose}
          />
          <aside className="absolute top-0 left-0 flex h-full w-[270px] flex-col border-r-2 bg-sidebar border-border shadow-xl">
            <div className="flex h-11 items-center justify-between border-b border-sidebar-border px-3">
              <div className="text-[12px] font-semibold text-sidebar-foreground">Reviewer Portal</div>
              <button
                onClick={onMobileClose}
                className="flex h-7 w-7 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                title="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-3">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-2.5">
                  <span className="mb-1 block px-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
                    {group.label}
                  </span>
                  <ul className="space-y-px">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <button
                            onClick={() => handleNavClick(item.path)}
                            className={`group flex w-full items-center gap-2 rounded px-1.5 py-1 text-[12px] font-medium transition-colors ${isActive(item.path)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 text-left">{item.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="border-t border-sidebar-border p-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-white">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-1 flex-col text-left overflow-hidden">
                  <span className="text-[12px] font-medium text-sidebar-foreground leading-tight truncate">
                    {userName}
                  </span>
                  <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
                    {userSubtitle}
                  </span>
                </div>
              </button>
              {userMenuOpen && (
                <div className="mt-1 rounded border border-sidebar-border bg-white py-0.5 shadow-lg">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <aside className="fixed top-0 left-0 z-40 hidden md:flex h-screen w-[235px] flex-col border-r-2 bg-sidebar border-border">
        <div className="flex h-11 items-center border-b border-sidebar-border px-3">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <img src={favicon} alt="LogiTrack Logo" className="h-5 w-5 shrink-0 object-contain" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-semibold text-sidebar-foreground leading-tight truncate">LogiTrack</span>
              <span className="text-[10px] text-sidebar-muted-foreground uppercase tracking-wider leading-tight truncate">ENERTECH SYSTEMS INDUSTRIES INC.</span>
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
        <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2.5">
              <span className="mb-1 block px-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
                {group.label}
              </span>
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => handleNavClick(item.path)}
                        className={`group flex w-full items-center gap-2 rounded px-1.5 py-1 text-[12px] font-medium transition-colors ${isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 text-left">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="relative border-t border-sidebar-border p-2">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-white">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-1 flex-col text-left overflow-hidden">
              <span className="text-[12px] font-medium text-sidebar-foreground leading-tight truncate">
                {userName}
              </span>
              <span className="text-[10px] text-sidebar-muted-foreground leading-tight truncate">
                {userSubtitle}
              </span>
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1 rounded border border-sidebar-border bg-white py-0.5 shadow-lg">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default ReviewerSidebar;
