<<<<<<< HEAD
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAppToast } from '../../../components/ui/alert-toast-provider';

function MembersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const toast = useAppToast();
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    department: '',
    role: 'user'
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditUserId(null);
    setFormData({ username: '', password: '', department: '', role: 'user' });
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setEditUserId(user._id);
    setFormData({ 
      username: user.username, 
      password: '', // Leave blank when editing
      department: user.department || '',
      role: user.role || 'user'
    });
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (isEditMode) {
        // Only send password if it was filled out
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }

        await axios.put(`/api/users/${editUserId}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated successfully');
      } else {
        await axios.post('/api/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User created successfully');
      }
      
      setIsModalOpen(false);
      setFormData({ username: '', password: '', department: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      console.error('Error submitting user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users, roles, and access.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Users Table Card */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                      {user._id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {user.username || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {visiblePasswords[user._id]
                            ? (user.plainPassword || '••••••••')
                            : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(user._id)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          title={visiblePasswords[user._id] ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswords[user._id]
                            ? <EyeOff className="h-3.5 w-3.5" />
                            : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.department || <span className="text-muted-foreground italic">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md border border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isEditMode ? 'Edit User' : 'Create New User'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Username *</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="johndoe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Password {isEditMode ? '(Leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    name="password"
                    required={!isEditMode}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showModalPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">Select Department</option>
                  <option value="Logistic">Logistic</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {isEditMode ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
=======
import { Construction } from 'lucide-react';

function MembersPage() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-ping rounded-full bg-sidebar-primary/20" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
            <Construction className="h-5 w-5" />
          </div>
        </div>

        <h1 className="mb-2 text-base font-bold tracking-tight text-foreground md:text-lg">
          Team Members Coming Soon
        </h1>
        <p className="mb-5 text-[11px] text-muted-foreground md:text-xs">
          We're building something amazing. This page is currently under construction
          and will be available in the next update.
        </p>

        <div className="grid w-full grid-cols-2 gap-2 text-left">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Module
            </div>
            <div className="text-[11px] font-medium">User Management</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Feature
            </div>
            <div className="text-[11px] font-medium">Role Assignment</div>
          </div>
        </div>
      </div>
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    </div>
  );
}

export default MembersPage;
