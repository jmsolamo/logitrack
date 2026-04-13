import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAppToast } from '../components/ui/alert-toast-provider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function SettingsPage() {
  const { user } = useOutletContext() || {};
  const toast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    newUsername: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error('Current password is required to save changes');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.put('/api/auth/update-profile', {
        currentPassword: formData.currentPassword,
        newUsername: formData.newUsername !== user?.username ? formData.newUsername : undefined,
        newPassword: formData.newPassword || undefined
      });

      // Update token and notify user
      localStorage.setItem('token', data.token);
      toast.success('Account settings updated successfully');

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Reload to reflect changes in layout (username)
      window.location.reload();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-1 px-1">
          <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Account Settings</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">Manage your profile credentials and security preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          {/* Profile Card */}
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden w-full">
            <div className="border-b border-border bg-muted/30 px-3 sm:px-4 py-3">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Profile Information</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5 w-full">
                <label 
                  htmlFor="newUsername" 
                  className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5"
                >
                  Username
                </label>
                <div className="relative group w-full">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="newUsername"
                    name="newUsername"
                    type="text"
                    value={formData.newUsername}
                    onChange={handleChange}
                    className="pl-10 h-10 text-xs focus-visible:ring-primary w-full"
                    placeholder="Enter new username"
                    autoComplete="username"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden w-full">
            <div className="border-b border-border bg-muted/30 px-3 sm:px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Security & Password</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="rounded bg-orange-50 border border-orange-100 p-4 w-full">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                  <p className="text-[11px] text-orange-700 leading-relaxed font-semibold uppercase tracking-tight">
                    Your current password is required to authorize any changes to your account.
                  </p>
                </div>
              </div>

              <div className="space-y-5 w-full">
                {/* Current Password */}
                <div className="space-y-2 w-full">
                  <label 
                    htmlFor="currentPassword" 
                    className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5"
                  >
                    Current Password
                  </label>
                  <div className="relative group w-full">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10 h-10 text-xs focus-visible:ring-primary w-full"
                      placeholder="Verify current password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors px-1"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border my-6 w-full" />

                {/* New Password Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <label 
                      htmlFor="newPassword" 
                      className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5"
                    >
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-10 text-xs focus-visible:ring-primary w-full"
                        placeholder="New password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label 
                      htmlFor="confirmPassword" 
                      className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-10 text-xs focus-visible:ring-primary w-full"
                        placeholder="Confirm password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-12 gap-2 uppercase tracking-widest text-[11px] font-bold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
