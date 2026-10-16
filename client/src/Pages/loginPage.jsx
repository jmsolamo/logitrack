import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppToast } from '../components/ui/alert-toast-provider';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { Lightbulb, Check, Copy, X, ArrowRight } from 'lucide-react';
import logo from '../assets/images/logo.png';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showDemoClue, setShowDemoClue] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  const demoRef = useRef(null);
  const navigate = useNavigate();
  const toast = useAppToast();

  const demoAccounts = [
    {
      role: 'Admin',
      roleBadgeClass: 'bg-primary/10 text-primary border-primary/20',
      username: 'demo-admin',
      password: '123456',
    },
    {
      role: 'Requestor',
      roleBadgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      username: 'demo-requestor',
      password: '123456',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (demoRef.current && !demoRef.current.contains(event.target)) {
        setShowDemoClue(false);
      }
    };
    if (showDemoClue) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDemoClue]);

  const handleFillDemo = (account) => {
    setFormData({
      username: account.username,
      password: account.password,
    });
    setShowDemoClue(false);
    toast.success(`${account.role} credentials applied!`);
  };

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const executeLogin = async (tokenToUse) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', {
        username: formData.username,
        password: formData.password,
        captchaToken: tokenToUse,
      });

      localStorage.setItem('token', data.token);

      toast.success('Login successful');
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'manager') {
        navigate('/reviewer/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Automatically bypass captcha for local network IP addresses or localhost
    const isLocalNetwork = window.location.hostname === 'localhost' || window.location.hostname.match(/^[0-9.]+$/);

    if (isLocalNetwork) {
      executeLogin('dev-bypass');
      return;
    }

    if (!showCaptcha) {
      setShowCaptcha(true);
      return;
    }

    if (!captchaToken) {
      toast.error('Please complete the reCAPTCHA verification to login.');
      return;
    }

    executeLogin(captchaToken);
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
    if (token) {
      executeLogin(token);
    }
  };

  return (
    <div className="relative flex min-h-screen p-4 overflow-y-auto">
      {/* Demo Accounts Clue Bulb (Top Right of Page) */}
      <div ref={demoRef} className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <button
          type="button"
          onClick={() => setShowDemoClue(!showDemoClue)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 border shadow-md backdrop-blur-md ${
            showDemoClue
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-amber-500/20 ring-2 ring-amber-500/30'
              : 'bg-card/90 text-foreground border-border hover:border-amber-500/40 hover:text-amber-500 hover:shadow-lg'
          }`}
          title="Demo Accounts Guide"
          aria-label="Demo Accounts Guide"
        >
          <Lightbulb className={`h-4 w-4 transition-all duration-300 ${showDemoClue ? 'scale-110 fill-amber-400 text-amber-500' : 'text-amber-500'}`} />
          <span className="text-xs font-semibold hidden sm:inline">Demo Accounts</span>
          {!showDemoClue && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          )}
        </button>

        {showDemoClue && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 p-3.5 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-500/15 text-amber-500">
                  <Lightbulb className="h-4 w-4 fill-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Demo Accounts</h4>
                  <p className="text-[10px] text-muted-foreground">Click any card to auto-fill</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoClue(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <div
                  key={account.role}
                  onClick={() => handleFillDemo(account)}
                  className="group relative p-2.5 bg-card hover:bg-muted/60 border border-border/80 hover:border-primary/50 rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${account.roleBadgeClass}`}>
                      {account.role}
                    </span>
                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 font-medium transition-opacity flex items-center gap-0.5">
                      Use account <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="bg-background px-2 py-1 rounded border border-border/60">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Username</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <code className="text-xs font-mono font-medium text-foreground truncate">{account.username}</code>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, account.username, `${account.role}-user`)}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted transition-colors shrink-0"
                          title="Copy username"
                        >
                          {copiedItem === `${account.role}-user` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-background px-2 py-1 rounded border border-border/60">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Password</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <code className="text-xs font-mono font-medium text-foreground truncate">{account.password}</code>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, account.password, `${account.role}-pass`)}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted transition-colors shrink-0"
                          title="Copy password"
                        >
                          {copiedItem === `${account.role}-pass` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="m-auto bg-card/80 backdrop-blur-md p-5 sm:p-6 2xl:p-8 rounded-lg shadow-2xl w-full max-w-sm 2xl:max-w-md border border-border">
        <div className="flex justify-center mb-4 2xl:mb-6">
          <img src={logo} alt="Logo" className="h-10 sm:h-12 2xl:h-14 w-auto" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-3">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground"
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
            </button>
          </div>

          {/* ReCAPTCHA Modal */}
          {showCaptcha && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-card p-6 rounded-lg shadow-2xl border border-border flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <h3 className="text-sm font-bold text-foreground tracking-tight">Security Check</h3>
                <p className="text-xs text-muted-foreground text-center max-w-[250px] -mt-2">
                  Please complete the reCAPTCHA below to continue logging in.
                </p>
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
                  onChange={handleCaptchaChange}
                />
                <button
                  type="button"
                  onClick={() => setShowCaptcha(false)}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="mt-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
