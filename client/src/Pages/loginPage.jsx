import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppToast } from '../components/ui/alert-toast-provider';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
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
  const navigate = useNavigate();
  const toast = useAppToast();

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
      } else if (data.user.role === 'reviewer') {
        navigate('/reviewer/requests');
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
    <div className="flex min-h-screen p-4 overflow-y-auto">
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
