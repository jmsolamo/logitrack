import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppToast } from '../components/ui/alert-toast-provider';
import axios from 'axios';
import logo from '../assets/images/logo.png';

function RegistrationPage() {
  const toast = useAppToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [hasPasswordBeenBlurred, setHasPasswordBeenBlurred] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [hasConfirmPasswordBeenBlurred, setHasConfirmPasswordBeenBlurred] = useState(false);

  const handleChange = (e) => {
    let value = e.target.value;
    // Prevent special characters in username
    if (e.target.name === 'username') {
      value = value.replace(/[^A-Za-z0-9_-]/g, '');
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Password requirement checks
  const password = formData.password;
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const criteriaCount = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
  const hasThreeCriteria = criteriaCount >= 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Password policy enforcement
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
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Send Email Verification
      await sendEmailVerification(userCredential.user);

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Save user to MongoDB
      await axios.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        role: 'user'
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      // Sign out since they need to verify their email first
      await auth.signOut();

      toast.success('Registration successful! Please check your email to verify your account.');
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      setHasPasswordBeenBlurred(false);
      setHasConfirmPasswordBeenBlurred(false);
    } catch (error) {
      // If MongoDB registration fails, delete the Firebase user to keep in sync
      if (auth.currentUser) {
        await auth.currentUser.delete().catch(() => { });
      }

      let errorMessage = 'Registration failed';
      if (error.response && error.response.status === 409) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();
      const user = result.user;

      // Extract name from Google profile
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const lastName = nameParts.length > 1 ? nameParts.pop() : '';
      const firstName = nameParts.join(' ');

      await axios.post('/api/auth/register', {
        username: user.email.split('@')[0],
        email: user.email,
        role: 'user'
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      toast.success('Registration successful!');
      localStorage.setItem('token', idToken);
    } catch (error) {
      // Sign out Firebase user if MongoDB registration fails
      await auth.signOut().catch(() => { });
      localStorage.removeItem('token');
      if (error.response && error.response.status === 409) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error.message || 'Google sign-up failed');
      }
    } finally {
      setLoading(false);
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
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground"
            required
          />

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
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => { setIsPasswordFocused(false); setHasPasswordBeenBlurred(true); }}
              className={`w-full px-3 py-2 text-sm bg-background border ${hasPasswordBeenBlurred && !isPasswordFocused ? ((!formData.password) || (!hasThreeCriteria) || (!isLengthValid || formData.password.length > 128) ? 'border-destructive border-l-4' : 'border-border') : 'border-border'} rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
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
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => { setIsConfirmPasswordFocused(false); setHasConfirmPasswordBeenBlurred(true); }}
              className={`w-full px-3 py-2 text-sm bg-background border ${hasConfirmPasswordBeenBlurred && !isConfirmPasswordFocused ? ((!formData.confirmPassword) || (formData.password !== formData.confirmPassword) ? 'border-destructive border-l-4' : 'border-border') : 'border-border'} rounded-md focus:outline-none focus:border-primary transition placeholder-muted-foreground text-foreground pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <i className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
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
          <button type="submit" disabled={loading} className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-semibold disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-[11px] text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground rounded-md hover:bg-muted transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>

        <p className="text-center mt-3 sm:mt-4 text-foreground text-xs sm:text-sm">
          Already have an account? <a href="/login" className="text-primary hover:underline font-medium">Login</a>
        </p>
      </div>
    </div>
  );
}

export default RegistrationPage;
