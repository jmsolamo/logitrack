import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  Loader2,
  Calendar,
  X,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRoles: ['user', 'reviewer', 'admin'],
    startDate: '',
    endDate: ''
  });

  const toast = useAppToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/announcements/all');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => {
      const newRoles = prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role];
      return { ...prev, targetRoles: newRoles };
    });
  };

  const openModal = (announcement = null) => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        targetRoles: announcement.targetRoles,
        startDate: announcement.startDate.split('T')[0],
        endDate: announcement.endDate.split('T')[0]
      });
      setEditingId(announcement._id);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        content: '',
        targetRoles: ['user', 'reviewer', 'admin'],
        startDate: today,
        endDate: today
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: '',
      content: '',
      targetRoles: ['user', 'reviewer', 'admin'],
      startDate: '',
      endDate: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      if (!formData.title || !formData.content || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required fields');
        setIsSubmitLoading(false);
        return;
      }

      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error('Start date must be before end date');
        setIsSubmitLoading(false);
        return;
      }

      if (editingId) {
        await axios.put(`/api/announcements/${editingId}`, formData);
        toast.success('Announcement updated successfully');
      } else {
        await axios.post('/api/announcements', formData);
        toast.success('Announcement created successfully');
      }

      fetchAnnouncements();
      closeModal();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    setAnnouncementToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await axios.delete(`/api/announcements/${announcementToDelete}`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setAnnouncementToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAnnouncementActive = (announcement) => {
    const now = new Date();
    const start = new Date(announcement.startDate);
    const end = new Date(announcement.endDate);
    return now >= start && now <= end;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Announcements</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage Your Announcements Effortlessly</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center border-b border-border pb-4">
        <div className="relative w-full max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH ANNOUNCEMENTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
          />
        </div>

        {searchQuery && (
          <button
            onClick={handleReset}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded px-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95"
            title="Clear filters"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}

        <button
          onClick={() => openModal()}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Add Announcement"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Announcements Grid */}
      <div className="flex-1 overflow-auto">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                onClick={() => { setSelectedAnnouncement(announcement); setShowViewModal(true); }}
                className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer group border-l-4 border-l-orange-500"
              >
                {/* Header with Status */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="flex-1 text-sm font-bold tracking-tight text-foreground line-clamp-2">
                    {announcement.title}
                  </h3>
                  <span className={`inline-flex shrink-0 items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest whitespace-nowrap ${isAnnouncementActive(announcement) ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isAnnouncementActive(announcement) ? 'bg-green-600' : 'bg-gray-600'}`} />
                    {isAnnouncementActive(announcement) ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Content Preview */}
                <p className="text-[12px] leading-relaxed text-muted-foreground mb-3 line-clamp-3 whitespace-pre-wrap">
                  {announcement.content}
                </p>

                {/* Info Lane - Combined */}
                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-4 text-[9px]">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground font-medium">Start:</span>
                    <span className="text-foreground font-medium">{formatDate(announcement.startDate)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground font-medium">End:</span>
                    <span className="text-foreground font-medium">{formatDate(announcement.endDate)}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground font-bold">Visible To:</span>
                    <div className="flex gap-1">
                      {announcement.targetRoles.map(role => (
                        <span key={role} className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tight bg-primary/10 text-primary border border-primary/20">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <span className="text-muted-foreground font-medium">Posted by:</span>
                    <span className="text-foreground font-medium">{announcement.createdBy} • {formatDate(announcement.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg animate-in fade-in zoom-in-95">
            <h2 className="mb-4 text-base font-bold uppercase tracking-tight text-foreground">
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter announcement title"
                  className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 py-1 text-[11px] placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Enter announcement content"
                  rows="4"
                  className="flex w-full rounded border border-input bg-card/50 px-2.5 py-1.5 text-[11px] placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none resize-none"
                />
              </div>

              {/* Date Range */}
              <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 100%; height: 100%; cursor: pointer; }
              `}</style>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                    Start Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 pr-8 py-1 text-[11px] focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                    <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                    End Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 pr-8 py-1 text-[11px] focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                    <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Target Roles */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-2">
                  Visible To *
                </label>
                <div className="space-y-2">
                  {['admin', 'reviewer', 'user'].map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.targetRoles.includes(role)}
                        onChange={() => handleRoleChange(role)}
                        className="h-3 w-3 rounded border-input rounded accent-primary"
                      />
                      <span className="text-[11px] font-bold uppercase tracking-tight text-foreground capitalize">
                        {role}s
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-8 rounded border border-input bg-muted text-foreground font-bold text-[11px] uppercase tracking-tight transition-all hover:bg-muted/80 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="flex-1 h-8 rounded bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-tight transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setAnnouncementToDelete(null);
          setIsDeleteDialogOpen(false);
        }}
        destructive
      />

      {/* View Announcement Modal */}
      {showViewModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowViewModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
                    Announcement Details
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isAnnouncementActive(selectedAnnouncement) ? 'Active' : 'Inactive'} announcement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="rounded-lg border border-border/50 bg-card p-4">
                  {/* Title */}
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="flex-1 text-lg font-bold tracking-tight text-foreground pr-2">
                      {selectedAnnouncement.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium tracking-tight bg-muted text-muted-foreground border border-border/50 whitespace-nowrap">
                      {formatDate(selectedAnnouncement.createdAt)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap mb-4">
                    {selectedAnnouncement.content}
                  </p>

                  {/* Info Grid */}
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-foreground/60 mb-1">Start Date</p>
                        <p className="text-[12px] text-muted-foreground">{formatDate(selectedAnnouncement.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-foreground/60 mb-1">End Date</p>
                        <p className="text-[12px] text-muted-foreground">{formatDate(selectedAnnouncement.endDate)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-foreground/60 mb-1">Posted By</p>
                        <p className="text-[12px] text-muted-foreground">{selectedAnnouncement.createdBy}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-foreground/60 mb-1">Created At</p>
                        <p className="text-[12px] text-muted-foreground">{formatDate(selectedAnnouncement.createdAt)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-tight text-foreground/60 mb-2">Visible To</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedAnnouncement.targetRoles.map(role => (
                          <span key={role} className="inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tight bg-primary/10 text-primary border border-primary/20">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-border bg-muted/50 px-6 py-3 backdrop-blur-sm flex gap-2">
              <button
                onClick={() => { setShowViewModal(false); openModal(selectedAnnouncement); }}
                className="flex-1 h-9 rounded-lg border border-input bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-tight transition-all hover:bg-primary/20 active:scale-95"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedAnnouncement._id)}
                className="flex-1 h-9 rounded-lg bg-red-600 text-white font-bold text-[11px] uppercase tracking-tight transition-all hover:bg-red-700 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;
