import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  FileText,
  UploadCloud,
  Search,
  Plus,
  Trash2,
  Eye,
  Download,
  Building2,
  Lock,
  User,
  ShieldCheck,
  X,
  FileCheck2,
  Calendar,
  AlertCircle,
  HardDrive,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { EmployeeDocument } from '../../types';

export const MyFolderModule: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'GOVT' | 'PERSONAL' | 'COMPANY' | 'PRIVATE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'PDF',
    category: 'GOVT' as 'GOVT' | 'PERSONAL' | 'COMPANY' | 'PRIVATE',
    docNumber: '',
    expiryDate: '',
    fileSize: '1.8 MB',
  });

  const loadDocuments = () => {
    setLoading(true);
    fetch(`/api/v1/employees/${currentUser.id}/documents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          setDocuments(currentUser.documents || []);
        }
      })
      .catch((err) => {
        console.error('Error loading documents:', err);
        setDocuments(currentUser.documents || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, [currentUser.id]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.name) {
      showToast('Validation Error', 'Please specify a document name', 'ERROR');
      return;
    }

    fetch(`/api/v1/employees/${currentUser.id}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadForm),
    })
      .then((res) => res.json())
      .then((newDoc) => {
        showToast('Document Uploaded', `Successfully added "${newDoc.name}" to your folder.`, 'SUCCESS');
        setIsUploadModalOpen(false);
        setUploadForm({
          name: '',
          type: 'PDF',
          category: 'GOVT',
          docNumber: '',
          expiryDate: '',
          fileSize: '1.8 MB',
        });
        loadDocuments();
      })
      .catch((err) => {
        showToast('Upload Error', 'Failed to save document.', 'ERROR');
      });
  };

  const handleDeleteDocument = (docId: string) => {
    fetch(`/api/v1/employees/${currentUser.id}/documents/${docId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Document Deleted', 'File removed from your private folder.', 'SUCCESS');
        setDeleteDocId(null);
        if (selectedDoc?.id === docId) setSelectedDoc(null);
        loadDocuments();
      })
      .catch(() => {
        showToast('Error', 'Failed to delete document.', 'ERROR');
      });
  };

  const categories = [
    { id: 'ALL', label: 'All Files', icon: FolderArchive, count: documents.length, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
    { id: 'GOVT', label: 'Govt Documents', icon: ShieldCheck, count: documents.filter((d) => d.category === 'GOVT').length, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400' },
    { id: 'PERSONAL', label: 'Personal Space', icon: User, count: documents.filter((d) => d.category === 'PERSONAL').length, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400' },
    { id: 'COMPANY', label: 'Company Files', icon: Building2, count: documents.filter((d) => d.category === 'COMPANY').length, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400' },
    { id: 'PRIVATE', label: 'Private Vault', icon: Lock, count: documents.filter((d) => d.category === 'PRIVATE').length, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.docNumber && doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.category && doc.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
                <FolderArchive className="h-3.5 w-3.5" />
                <span>My Folder • Encrypted Storage</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser.firstName}'s Personal Document Folder
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Store, organize, and access all your official government proofs, personal space records, company NDAs, and encrypted private vault documents in one place.
            </p>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/40 hover:bg-blue-500 active:scale-95 transition-all shrink-0"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload New Document</span>
          </button>
        </div>

        {/* Stats Grid inside Banner */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-700/60">
          <div className="rounded-2xl bg-slate-800/60 p-3 backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400">Total Files</span>
            <div className="text-lg font-extrabold text-white">{documents.length} Records</div>
          </div>
          <div className="rounded-2xl bg-slate-800/60 p-3 backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400">Vault Security</span>
            <div className="text-lg font-extrabold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> 256-Bit AES
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/60 p-3 backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400">Storage Used</span>
            <div className="text-lg font-extrabold text-blue-400">14.8 MB / 10 GB</div>
          </div>
          <div className="rounded-2xl bg-slate-800/60 p-3 backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400">User Identity</span>
            <div className="text-xs font-bold text-slate-200 truncate">{currentUser.code}</div>
          </div>
        </div>
      </div>

      {/* Category Folders & Search Bar */}
      <div className="flex flex-col gap-4">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-105'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : cat.color
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Options */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by title, document number, or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
            Showing <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredDocs.length}</strong> of {documents.length} files
          </div>
        </div>
      </div>

      {/* Document Grid / List */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-4">
            <FolderArchive className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Documents Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
            There are no documents uploaded under this folder category yet.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const categoryBadge =
              doc.category === 'GOVT'
                ? { label: 'Govt Document', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300', icon: ShieldCheck }
                : doc.category === 'PERSONAL'
                ? { label: 'Personal Space', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300', icon: User }
                : doc.category === 'COMPANY'
                ? { label: 'Company File', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300', icon: Building2 }
                : { label: 'Private Vault', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300', icon: Lock };

            const CategoryIcon = categoryBadge.icon;

            return (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${categoryBadge.bg}`}
                    >
                      <CategoryIcon className="h-3 w-3" />
                      <span>{categoryBadge.label}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      {doc.type || 'PDF'} • {doc.fileSize || '1.2 MB'}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {doc.name}
                      </h4>
                      {doc.docNumber && (
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          Ref: {doc.docNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Uploaded {doc.uploadDate}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 transition-colors"
                      title="View Document Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        showToast('Downloading File', `Starting download for ${doc.name}...`, 'INFO');
                      }}
                      className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 transition-colors"
                      title="Download Document"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteDocId(doc.id)}
                      className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <UploadCloud className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Upload to My Folder</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g. Passport Proof 2026.pdf"
                  className="w-full rounded-xl border border-slate-200 p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Space / Category *
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  >
                    <option value="GOVT">🏛️ Govt Documents</option>
                    <option value="PERSONAL">👤 Personal Space</option>
                    <option value="COMPANY">🏢 Company Documents</option>
                    <option value="PRIVATE">🔒 Private Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document / Ref Number
                  </label>
                  <input
                    type="text"
                    value={uploadForm.docNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, docNumber: e.target.value })}
                    placeholder="e.g. AADHAAR-9901-22"
                    className="w-full rounded-xl border border-slate-200 p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Simulated File Dropzone */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select File (PDF / JPG / PNG)
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
                  <UploadCloud className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to attach or drag document here
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size 25 MB • Encrypted before upload</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Save to My Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDoc.name}</h3>
                  <p className="text-[11px] text-slate-500">Category: {selectedDoc.category || 'GOVT'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Document Visual Viewer Canvas Simulation */}
              <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-8 text-center dark:border-slate-800 dark:bg-slate-950">
                <FileCheck2 className="h-16 w-16 text-blue-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedDoc.name}</h4>
                <p className="text-xs font-mono text-slate-500 mt-1">Ref ID: {selectedDoc.docNumber || 'DOC-VERIFIED'}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Official Enterprise Verified Record
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400">Upload Timestamp</span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.uploadDate}</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400">File Format & Size</span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.type || 'PDF'} ({selectedDoc.fileSize || '1.5 MB'})</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <button
                onClick={() => setDeleteDocId(selectedDoc.id)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-950/60 dark:bg-rose-950/40 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete File</span>
              </button>

              <button
                onClick={() => {
                  showToast('Downloading', `Downloading ${selectedDoc.name}...`, 'SUCCESS');
                  setSelectedDoc(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {deleteDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/80">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Document</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this document from your personal folder? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteDocId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteDocId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
