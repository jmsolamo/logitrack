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
  const [departments, setDepartments] = useState([]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const toast = useAppToast();
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    department: '',
    role: 'requestor'
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

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditUserId(null);
    setFormData({ username: '', password: '', department: '', role: 'requestor' });
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
      role: user.role || 'requestor'
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
      setFormData({ username: '', password: '', department: '', role: 'requestor' });
      fetchUsers();
    } catch (error) {
      console.error('Error submitting user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/departments', { name: newDepartmentName.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Department added');
      setNewDepartmentName('');
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add department');
    }
  };

  const handleUpdateDepartment = async (id) => {
    if (!editDeptName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/departments/${id}`, { name: editDeptName.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Department updated');
      setEditingDeptId(null);
      setEditDeptName('');
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/departments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Department deleted');
        fetchDepartments();
      } catch (error) {
        toast.error('Failed to delete department');
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <i className="bx bx-group text-xl"></i>
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-foreground uppercase tracking-tight">User Management</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Manage system users, roles, and access.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="flex h-8 items-center justify-center rounded bg-secondary px-3 text-[10px] font-bold text-secondary-foreground hover:opacity-90 transition-opacity uppercase tracking-wider"
            title="Manage Departments"
          >
            Departments
          </button>
          <button
            onClick={openAddModal}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            title="Add User"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="flex-1 overflow-auto bg-card min-w-0 min-h-0 relative rounded-lg border border-border">
        <table className="w-full min-w-max border-collapse relative">
          <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
              <tr className="border-b border-orange-600/20">
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Username</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Password</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Department</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Role</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle bg-orange-500 sticky right-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-center opacity-70">
                      <i className="bx bx-group text-3xl text-muted-foreground/50 mb-1"></i>
                      <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No users found</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Add a new user to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user._id} className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-card/30' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">
                      {user.username || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-wider">
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
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">
                      {user.department || <span className="text-muted-foreground/50 text-[9px] tracking-widest italic uppercase">None</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold tracking-tight align-middle">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold ${
                        user.role === 'admin'
                          ? 'bg-blue-500/10 text-blue-600'
                          : user.role === 'manager'
                            ? 'bg-orange-500/10 text-orange-600'
                            : 'bg-green-500/10 text-green-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-center sticky right-0 bg-card border-l border-border/30">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[450px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                    {isEditMode ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </div>
                  <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                    {isEditMode ? 'EDIT USER' : 'NEW USER'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 pt-3">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Username *</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block h-9 w-full rounded border border-input bg-background px-3 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                  placeholder="johndoe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Password {isEditMode ? '(Optional)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    name="password"
                    required={!isEditMode}
                    value={formData.password}
                    onChange={handleChange}
                    className="block h-9 w-full rounded border border-input bg-background px-3 pr-10 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="block h-9 w-full rounded border border-input bg-background px-3 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block h-9 w-full rounded border border-input bg-background px-3 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="requestor">Requestor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  type="submit"
                  form="user-form"
                  className="inline-flex h-8 items-center justify-center rounded bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {isEditMode ? 'SAVE CHANGES' : 'CREATE USER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Departments Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[450px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary/10 text-secondary-foreground">
                    <i className="bx bx-buildings text-sm"></i>
                  </div>
                  <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                    MANAGE DEPARTMENTS
                  </h2>
                </div>
                <button 
                  onClick={() => setIsDeptModalOpen(false)}
                  className="rounded-full flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form onSubmit={handleAddDepartment} className="flex gap-2">
                <input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="New Department Name"
                  className="block h-9 flex-1 rounded border border-input bg-background px-3 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                />
                <button
                  type="submit"
                  disabled={!newDepartmentName.trim()}
                  className="inline-flex h-9 items-center justify-center rounded bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2 mt-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Existing Departments</h3>
                {departments.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No departments found.</p>
                ) : (
                  <ul className="space-y-2">
                    {departments.map((dept) => (
                      <li key={dept.id} className="flex items-center justify-between p-2 rounded border border-border bg-card/50">
                        {editingDeptId === dept.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editDeptName}
                              onChange={(e) => setEditDeptName(e.target.value)}
                              className="block h-8 flex-1 rounded border border-input bg-background px-2 text-[12px] font-medium"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateDepartment(dept.id)}
                              className="h-8 px-2 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 text-[10px] font-bold uppercase"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDeptId(null)}
                              className="h-8 px-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] font-bold uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[12px] font-medium">{dept.name}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingDeptId(dept.id);
                                  setEditDeptName(dept.name);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersPage;
