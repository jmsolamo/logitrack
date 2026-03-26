import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useAppToast } from '../components/ui/alert-toast-provider';
import axios from 'axios';
import logo from '../assets/images/logo.png';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [showGoogleConfirmPassword, setShowGoogleConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useAppToast();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      }
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        toast.error('Please verify your email before logging in. Check your inbox.');
        return;
      }

      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('token', idToken);

      // Check user role and navigate accordingly
      const { data: profile } = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      toast.success('Login successful');
      navigate(profile.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();
      localStorage.setItem('token', idToken);

      // Check if user exists in MongoDB - use direct axios call without interceptor
      const { data } = await axios.get('/api/auth/check', {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (!data.exists) {
        // User not registered — delete Firebase user and block login
        if (auth.currentUser) {
          await auth.currentUser.delete().catch(() => { });
        }
        localStorage.removeItem('token');
        toast.error('Account not found. Please register first.');
        return;
      }

      // Check if user has a password provider setup in Firebase
      // Firebase providerData contains an array of providers linked to the account.
      // If 'password' is not in this array, we know they haven't set a local password.
      const hasPasswordProvider = result.user.providerData.some(p => p.providerId === 'password');

      if (!hasPasswordProvider) {
        setGoogleUserContext({ user: result.user, idToken });
        return; // Early return to let the UI show the password modal instead
      }

      toast.success('Login successful');
      // Check user role and navigate accordingly
      const { data: profile } = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      navigate(profile.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (error) {
      localStorage.removeItem('token');
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };
  const [googleUserContext, setGoogleUserContext] = useState(null);
  const [hasPasswordBeenBlurred, setHasPasswordBeenBlurred] = useState(false);
  const [hasConfirmPasswordBeenBlurred, setHasConfirmPasswordBeenBlurred] = useState(false);

  // Password requirement checks for Google Modal
  const password = formData.password;
  const isLengthValid = password ? password.length >= 8 : false;
  const hasUppercase = /[A-Z]/.test(password || '');
  const hasLowercase = /[a-z]/.test(password || '');
  const hasNumber = /[0-9]/.test(password || '');
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password || '');
  const criteriaCount = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
  const hasThreeCriteria = criteriaCount >= 3;

  const handleGooglePasswordSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isLengthValid) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (!hasThreeCriteria) {
      toast.error('Password must contain at least 3 of the following: uppercase, lowercase, numbers, or special characters');
      return;
    }

    setLoading(true);
    try {
      const { user } = googleUserContext;

      // Update password
      await updatePassword(user, formData.password);

      const freshToken = await user.getIdToken(true);
      localStorage.setItem('token', freshToken);

      setGoogleUserContext(null);
      setHasPasswordBeenBlurred(false);
      setHasConfirmPasswordBeenBlurred(false);
      toast.success('Password set successfully! Logging in...');

      // Check user role and navigate accordingly
      const { data: profile } = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      navigate(profile.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');

    } catch (error) {
      toast.error(error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="flex min-h-screen p-4 overflow-y-auto">
      <div className="m-auto bg-card/80 backdrop-blur-md p-5 sm:p-6 2xl:p-8 rounded-lg shadow-2xl w-full max-w-sm 2xl:max-w-md border border-border">
        <div className="flex justify-center mb-4 2xl:mb-6">
          <img src={logo} alt="Logo" className="h-10 sm:h-12 2xl:h-14 w-auto" />
        </div>
        <h2 className="text-center text-lg font-semibold mb-2 text-foreground">Reset Password</h2>
        <p className="text-xs text-muted-foreground mb-4 text-center">
          Enter your email address to receive a password reset link.
        </p>
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-2 sm:gap-3">
          <input
            type="email"
            placeholder="Email address"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground"
            required
          />
          <button type="submit" disabled={resetLoading} className="mt-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold disabled:opacity-50">
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <button type="button" onClick={() => setShowForgotPassword(false)} disabled={resetLoading} className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition font-semibold disabled:opacity-50">
            Back to Login
          </button>
        </form>
      </div>
      </div>
    );
  }

  if (googleUserContext) {
    return (
      <div className="flex min-h-screen p-4 overflow-y-auto">
      <div className="m-auto bg-card/80 backdrop-blur-md p-5 sm:p-6 2xl:p-8 rounded-lg shadow-2xl w-full max-w-sm 2xl:max-w-md border border-border">
        <div className="flex justify-center mb-4 2xl:mb-6">
          <img src={logo} alt="Logo" className="h-10 sm:h-12 2xl:h-14 w-auto" />
        </div>
        <h2 className="text-center text-lg font-semibold mb-3 text-foreground">Set a Password</h2>
        <p className="text-xs text-muted-foreground mb-4 text-center">To use normal email/password login in the future, please set a password for your account.</p>
        <form onSubmit={handleGooglePasswordSubmit} className="flex flex-col gap-2 sm:gap-3">
          <div className="relative w-full">
            <input
              type={showGooglePassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => { setIsPasswordFocused(false); setHasPasswordBeenBlurred(true); }}
              className={`w-full px-3 py-2 text-sm bg-background border ${hasPasswordBeenBlurred && !isPasswordFocused ? ((!formData.password) || (!hasThreeCriteria) || (!isLengthValid || formData.password.length > 128) ? 'border-destructive border-l-4' : 'border-border') : 'border-border'} rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground pr-10`}
              required
            />
              <button
                type="button"
                onClick={() => setShowGooglePassword(!showGooglePassword)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                <i className={`bx ${showGooglePassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
              </button>

              {/* Password Requirements Tooltip */}
              {isPasswordFocused && (
                <div className="absolute z-50 top-full mt-2 left-0 w-64 sm:w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-card p-3 rounded-lg shadow-xl border border-border flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className={`leading-snug ${isLengthValid && hasThreeCriteria ? 'text-green-600' : ''}`}>
                      Passwords must be at least 8<br />
                      characters long and contain at least 3<br />
                      of the following:
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-600' : ''}`}>
                        <i className={`bx ${hasUppercase ? 'bxs-check-circle' : 'bx-check-circle'} text-base`}></i>
                        <span>Uppercase letters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600' : ''}`}>
                        <i className={`bx ${hasLowercase ? 'bxs-check-circle' : 'bx-check-circle'} text-base`}></i>
                        <span>Lowercase letters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600' : ''}`}>
                        <i className={`bx ${hasNumber ? 'bxs-check-circle' : 'bx-check-circle'} text-base`}></i>
                        <span>Numbers</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-green-600' : ''}`}>
                        <i className={`bx ${hasSpecialChar ? 'bxs-check-circle' : 'bx-check-circle'} text-base`}></i>
                        <span>Non-alphanumeric characters</span>
                      </div>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute -top-1.5 left-10 w-3 h-3 bg-card border-t border-l border-border rotate-45"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Warnings Below Field */}
            <div className="text-xs px-1 -mt-1 mb-1">
              {hasPasswordBeenBlurred && !isPasswordFocused ? (
                <>
                  {!formData.password ? (
                    <p className="text-destructive leading-tight">
                      A password is required.
                    </p>
                  ) : (!isLengthValid || formData.password.length > 128) ? (
                    <p className="text-destructive leading-tight">
                      Your password must have a minimum of 8 characters and a maximum of 128 characters.
                    </p>
                  ) : !hasThreeCriteria ? (
                    <p className="text-destructive leading-tight">
                      Your password must include a minimum of three of the following mix of character types: uppercase, lowercase, numbers, and ! @ # $ % ^ &amp; * () &lt;&gt; [] {'{}'} | _+-= symbols.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="relative w-full">
            <input
              type={showGoogleConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword || ''}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => { setIsConfirmPasswordFocused(false); setHasConfirmPasswordBeenBlurred(true); }}
              className={`w-full px-3 py-2 text-sm bg-background border ${hasConfirmPasswordBeenBlurred && !isConfirmPasswordFocused ? ((!formData.confirmPassword) || (formData.password !== formData.confirmPassword) ? 'border-destructive border-l-4' : 'border-border') : 'border-border'} rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground pr-10`}
              required
            />
              <button
                type="button"
                onClick={() => setShowGoogleConfirmPassword(!showGoogleConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                <i className={`bx ${showGoogleConfirmPassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
              </button>
            </div>

            <div className="text-xs px-1 -mt-1 mb-1">
              {hasConfirmPasswordBeenBlurred && !isConfirmPasswordFocused ? (
                <>
                  {!formData.confirmPassword ? (
                    <p className="text-destructive leading-tight">
                      You must confirm your password.
                    </p>
                  ) : formData.password !== formData.confirmPassword ? (
                    <p className="text-destructive leading-tight">
                      The passwords don't match.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          <button type="submit" disabled={loading} className="mt-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold disabled:opacity-50">
            {loading ? 'Setting Password...' : 'Save & Continue'}
          </button>
          <button type="button" onClick={() => { setGoogleUserContext(null); setHasPasswordBeenBlurred(false); setHasConfirmPasswordBeenBlurred(false); auth.signOut(); }} disabled={loading} className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition font-semibold disabled:opacity-50">
            Cancel
          </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen p-4 overflow-y-auto">
      <div className="m-auto bg-card/80 backdrop-blur-md p-5 sm:p-6 2xl:p-8 rounded-lg shadow-2xl w-full max-w-sm 2xl:max-w-md border border-border">
        <div className="flex justify-center mb-4 2xl:mb-6">
          <img src={logo} alt="Logo" className="h-10 sm:h-12 2xl:h-14 w-auto" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
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
          <div className="flex justify-end -mt-0.5 mb-1">
            <button
              type="button"
              onClick={() => {
                setResetEmail(formData.email);
                setShowForgotPassword(true);
              }}
              className="text-xs text-primary hover:text-primary/80 hover:underline transition"
            >
              Forgot Password?
            </button>
          </div>
          <button type="submit" disabled={loading} className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-[11px] text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground rounded-md hover:bg-muted transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-3 sm:mt-4 text-foreground text-xs sm:text-sm">
          Don't have an account? <a href="/register" className="text-primary hover:underline font-medium">Register</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
