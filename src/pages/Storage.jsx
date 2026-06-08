// src/pages/Storage.jsx
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '../components/Toast.jsx';
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient } from '../utils/supabaseClient';

// Helper to format byte sizes
function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Icon Components
const FolderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const PDFFileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15v2" />
    <path d="M12 15v2" />
    <path d="M15 15v2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export default function Storage() {
  const showToast = useToast();

  // ── storage states ───────────────────────────────────────────────────────
  const [path, setPath] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // ── configuration states ──────────────────────────────────────────────────
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(getSupabaseConfig());
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  // ── merge states ──────────────────────────────────────────────────────────
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergedName, setMergedName] = useState('');
  const [mergedNameError, setMergedNameError] = useState('');
  const [merging, setMerging] = useState(false);

  // refs
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const isConfigured = config.url && config.key && config.bucket;

  useEffect(() => {
    if (isConfigured) {
      listFilesAndFolders();
    } else {
      setShowConfig(true);
    }
  }, [path]);

  // List folder contents
  const listFilesAndFolders = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    setLoading(true);
    try {
      const { data, error } = await client.storage
        .from(config.bucket)
        .list(path || undefined, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;

      // Filter out placeholder .keep files
      const filtered = (data || []).filter((item) => item.name !== '.keep');
      setItems(filtered);
    } catch (err) {
      console.error(err);
      showToast('Error loading directory listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Navigating paths
  const handleFolderClick = (folderName) => {
    const newPath = path ? `${path}/${folderName}` : folderName;
    setPath(newPath);
    setSelectedFiles([]);
  };

  const handleCreateFolderClick = async () => {
    const folderName = window.prompt('Enter new folder name:');
    if (!folderName || !folderName.trim()) return;

    const cleanName = folderName.trim().replace(/[^a-zA-Z0-9_\s-]/g, '');
    if (!cleanName) {
      showToast('Invalid folder name (letters, numbers, space, dash, underscore only)', 'error');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      showToast('Supabase is not configured', 'error');
      return;
    }

    setCreatingFolder(true);
    try {
      const placeholderPath = path ? `${path}/${cleanName}/.keep` : `${cleanName}/.keep`;
      const { error } = await client.storage
        .from(config.bucket)
        .upload(placeholderPath, new Blob([''], { type: 'text/plain' }), {
          upsert: true,
        });

      if (error) throw error;
      showToast(`Folder "${cleanName}" created!`, 'success');
      listFilesAndFolders();
    } catch (err) {
      console.error(err);
      showToast('Failed to create folder', 'error');
    } finally {
      setCreatingFolder(false);
    }
  };

  // File / Folder Uploads
  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerFolderUpload = () => folderInputRef.current?.click();

  const handleFileUpload = async (event) => {
    const client = getSupabaseClient();
    if (!client) return;

    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of uploadedFiles) {
        const dest = path ? `${path}/${file.name}` : file.name;
        const { error } = await client.storage
          .from(config.bucket)
          .upload(dest, file, { upsert: true });

        if (error) throw error;
      }
      showToast(`Uploaded ${uploadedFiles.length} file(s) successfully!`, 'success');
      listFilesAndFolders();
    } catch (err) {
      console.error(err);
      showToast('Error uploading file(s)', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFolderUpload = async (event) => {
    const client = getSupabaseClient();
    if (!client) return;

    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of uploadedFiles) {
        const relativePath = file.webkitRelativePath || file.name;
        const dest = path ? `${path}/${relativePath}` : relativePath;

        const { error } = await client.storage
          .from(config.bucket)
          .upload(dest, file, { upsert: true });

        if (error) throw error;
      }
      showToast(`Uploaded folder structure successfully!`, 'success');
      listFilesAndFolders();
    } catch (err) {
      console.error(err);
      showToast('Error uploading folder structure', 'error');
    } finally {
      setUploading(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  // File Download / Share
  const handleDownloadFile = async (itemName) => {
    const client = getSupabaseClient();
    if (!client) return;

    showToast('Preparing download...', 'info');
    try {
      const filePath = path ? `${path}/${itemName}` : itemName;
      const { data, error } = await client.storage
        .from(config.bucket)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = itemName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error(err);
      showToast('Failed to download file', 'error');
    }
  };

  const handleShareFile = async (itemName) => {
    const client = getSupabaseClient();
    if (!client) return;

    showToast('Fetching file to share...', 'info');
    try {
      const filePath = path ? `${path}/${itemName}` : itemName;
      const { data, error } = await client.storage
        .from(config.bucket)
        .download(filePath);

      if (error) throw error;

      const isPdf = itemName.toLowerCase().endsWith('.pdf');
      const file = new File([data], itemName, { type: data.type || (isPdf ? 'application/pdf' : 'application/octet-stream') });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: itemName });
      } else {
        const url = URL.createObjectURL(data);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to share file', 'error');
    }
  };

  // Delete File or Folder (recursive)
  const handleDeleteItem = async (item) => {
    const client = getSupabaseClient();
    if (!client) return;

    const isFolder = !item.id && !item.metadata;
    const itemName = item.name;
    const itemPath = path ? `${path}/${itemName}` : itemName;

    if (isFolder) {
      if (!window.confirm(`Are you sure you want to delete folder "${itemName}" and ALL of its contents?`)) {
        return;
      }

      setLoading(true);
      try {
        // Find all nested items to delete them recursively
        const getPathsRecursive = async (prefix) => {
          const { data, error } = await client.storage.from(config.bucket).list(prefix, { limit: 100 });
          if (error) throw error;

          let files = [];
          for (const node of (data || [])) {
            const nodePath = `${prefix}/${node.name}`;
            if (!node.id && !node.metadata) {
              const subPaths = await getPathsRecursive(nodePath);
              files = [...files, ...subPaths];
            } else {
              files.push(nodePath);
            }
          }
          return files;
        };

        const filesToDelete = await getPathsRecursive(itemPath);
        // Include .keep placeholder if present
        const keepFile = `${itemPath}/.keep`;
        if (!filesToDelete.includes(keepFile)) {
          filesToDelete.push(keepFile);
        }

        if (filesToDelete.length > 0) {
          const { error } = await client.storage.from(config.bucket).remove(filesToDelete);
          if (error) throw error;
        }

        showToast(`Folder "${itemName}" deleted successfully`, 'success');
        listFilesAndFolders();
      } catch (err) {
        console.error(err);
        showToast('Error deleting folder contents', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
        return;
      }

      setLoading(true);
      try {
        const { error } = await client.storage.from(config.bucket).remove([itemPath]);
        if (error) throw error;

        showToast(`File "${itemName}" deleted`, 'success');
        setSelectedFiles(prev => prev.filter(f => f !== itemName));
        listFilesAndFolders();
      } catch (err) {
        console.error(err);
        showToast('Error deleting file', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // PDF Merging
  const handleMergeCheckboxChange = (fileName) => {
    setSelectedFiles((prev) =>
      prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]
    );
  };

  const triggerPDFMergeClick = () => {
    setMergedName('MERGED_PDF');
    setMergedNameError('');
    setShowMergeModal(true);
  };

  const handleMergedNameChange = (val) => {
    const uppercase = val.toUpperCase().replace(/[^A-Z0-9_\s-]/g, '');
    setMergedName(uppercase);
    if (!uppercase.trim()) {
      setMergedNameError('Filename is required');
    } else {
      setMergedNameError('');
    }
  };

  const executePDFMerge = async () => {
    if (!mergedName.trim()) return;
    const finalFilename = mergedName.endsWith('.pdf') ? mergedName : `${mergedName}.pdf`;

    const client = getSupabaseClient();
    if (!client) return;

    setMerging(true);
    setShowMergeModal(false);
    showToast('Merging selected PDFs...', 'info');

    try {
      const mergedDoc = await PDFDocument.create();

      for (const fileName of selectedFiles) {
        const filePath = path ? `${path}/${fileName}` : fileName;
        const { data, error } = await client.storage.from(config.bucket).download(filePath);
        if (error) throw error;

        const arrayBuffer = await data.arrayBuffer();
        const donorDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedDoc.copyPages(donorDoc, donorDoc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const mergedPdfBytes = await mergedDoc.save();
      const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const mergedFile = new File([mergedBlob], finalFilename, { type: 'application/pdf' });

      // Save back to storage
      const destPath = path ? `${path}/${finalFilename}` : finalFilename;
      const { error: uploadError } = await client.storage
        .from(config.bucket)
        .upload(destPath, mergedFile, { upsert: true });

      if (uploadError) throw uploadError;

      showToast(`PDFs merged & saved as "${finalFilename}"`, 'success');

      // Download locally
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setSelectedFiles([]);
      listFilesAndFolders();
    } catch (err) {
      console.error(err);
      showToast('Error merging PDFs', 'error');
    } finally {
      setMerging(false);
    }
  };

  // Test Supabase settings
  const handleTestConnection = async () => {
    if (!config.url || !config.key || !config.bucket) {
      showToast('Please fill all configuration fields', 'error');
      return;
    }

    setTestStatus('loading');
    try {
      const client = createClient(config.url.trim(), config.key.trim());
      // Test listing a single item
      const { error } = await client.storage.from(config.bucket.trim()).list('', { limit: 1 });
      
      if (error) throw error;

      setTestStatus('success');
      saveSupabaseConfig(config);
      showToast('Connection Successful! Configuration Saved.', 'success');
      setTimeout(() => {
        listFilesAndFolders();
      }, 500);
    } catch (err) {
      console.error(err);
      setTestStatus('error');
      showToast('Connection failed. Verify your Supabase URL, Anon Key, and Bucket Name.', 'error');
    }
  };

  const renderBreadcrumbs = () => {
    if (!path) return <span style={{ fontWeight: 600, color: '#475569' }}>Root</span>;

    const parts = path.split('/');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, color: '#64748b' }}>
        <span
          style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => { setPath(''); setSelectedFiles([]); }}
        >
          Root
        </span>
        {parts.map((p, idx) => {
          const current = parts.slice(0, idx + 1).join('/');
          const isLast = idx === parts.length - 1;
          return (
            <span key={current} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>/</span>
              {isLast ? (
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{p}</span>
              ) : (
                <span
                  style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => { setPath(current); setSelectedFiles([]); }}
                >
                  {p}
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  };

  return (
    <>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="top-bar">
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>Supabase Storage</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn-secondary${showConfig ? ' active' : ''}`}
            style={{ padding: '8px 10px', minHeight: 36, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setShowConfig(!showConfig)}
          >
            <SettingsIcon />
            Settings
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '8px 10px', minHeight: 36, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #cbd5e1' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: 160 }}>
        {/* ── SECTION 1: Credentials configuration ───────────────────────── */}
        {showConfig && (
          <div className="section-card" style={{ border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            <div className="section-title">⚙️ Supabase Settings</div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, marginTop: -4 }}>
              Setup your free Supabase project details below to enable directory structures, files uploads, and PDF merges.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="field-label">Project URL</label>
                <input
                  className="field-input"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                />
              </div>
              <div>
                <label className="field-label">Anon Key (API Key)</label>
                <input
                  className="field-input"
                  type="password"
                  value={config.key}
                  onChange={(e) => setConfig({ ...config, key: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>
              <div>
                <label className="field-label">Storage Bucket Name</label>
                <input
                  className="field-input"
                  value={config.bucket}
                  onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                  placeholder="invoices"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleTestConnection}
                  disabled={testStatus === 'loading'}
                >
                  {testStatus === 'loading' ? <span className="spinner" /> : '🔌 Test & Save'}
                </button>
                {testStatus === 'success' && (
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                    ✓ Connected
                  </span>
                )}
                {testStatus === 'error' && (
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                    ✗ Failed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 2: Navigation Breadcrumbs ──────────────────────────── */}
        {isConfigured && (
          <div className="section-card" style={{ marginBottom: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {renderBreadcrumbs()}
              {path && (
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: 11, minHeight: 24 }}
                  onClick={() => {
                    const idx = path.lastIndexOf('/');
                    setPath(idx === -1 ? '' : path.substring(0, idx));
                    setSelectedFiles([]);
                  }}
                >
                  ↑ Up
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION 3: Operations Toolbar ─────────────────────────────── */}
        {isConfigured && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: 12, minHeight: 44, padding: 8, flexDirection: 'column', gap: 4 }}
              onClick={handleCreateFolderClick}
              disabled={creatingFolder}
            >
              📁 + Folder
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: 12, minHeight: 44, padding: 8, flexDirection: 'column', gap: 4 }}
              onClick={triggerFileUpload}
              disabled={uploading}
            >
              📄 Upload File(s)
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: 12, minHeight: 44, padding: 8, flexDirection: 'column', gap: 4 }}
              onClick={triggerFolderUpload}
              disabled={uploading}
            >
              📦 Upload Folder
            </button>
          </div>
        )}

        {/* Hidden inputs for uploading */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          multiple
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderUpload}
          style={{ display: 'none' }}
          webkitdirectory="true"
          directory="true"
          multiple
        />

        {/* ── SECTION 4: Directory list ──────────────────────────────────── */}
        {isConfigured && (
          <div className="section-card" style={{ padding: 0 }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span className="spinner" />
                <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Refreshing contents...</p>
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="empty-state" style={{ padding: '50px 16px', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>This folder is empty.</p>
                <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                  Use the toolbar above to upload files/folders or make a new directory!
                </p>
              </div>
            )}

            {!loading && items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item) => {
                  const isFolder = !item.id && !item.metadata;
                  const isPdf = item.name.toLowerCase().endsWith('.pdf');
                  const itemChecked = selectedFiles.includes(item.name);

                  return (
                    <div
                      key={item.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        background: itemChecked ? 'rgba(99,102,241,0.04)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Checkbox (only for PDF files for merging) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        {isPdf ? (
                          <input
                            type="checkbox"
                            checked={itemChecked}
                            onChange={() => handleMergeCheckboxChange(item.name)}
                            style={{
                              width: 17,
                              height: 17,
                              cursor: 'pointer',
                              accentColor: '#6366f1'
                            }}
                          />
                        ) : (
                          // Placeholder spacing for non-PDFs to keep alignment
                          <div style={{ width: 17 }} />
                        )}

                        {/* Icon & Details */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: isFolder ? 'pointer' : 'default',
                            flex: 1,
                            minWidth: 0,
                          }}
                          onClick={() => isFolder && handleFolderClick(item.name)}
                        >
                          {isFolder ? <FolderIcon /> : isPdf ? <PDFFileIcon /> : <FileIcon />}
                          
                          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: isFolder ? '600' : '500',
                                color: isFolder ? '#2563eb' : '#0f172a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.name}
                            </span>
                            {!isFolder && (
                              <span style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                                {formatBytes(item.metadata?.size)} • {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
                        {!isFolder && (
                          <>
                            <button
                              className="btn-secondary"
                              style={{ padding: 6, minHeight: 30, borderRadius: 6 }}
                              onClick={() => handleDownloadFile(item.name)}
                              title="Download"
                            >
                              <DownloadIcon />
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: 6, minHeight: 30, borderRadius: 6 }}
                              onClick={() => handleShareFile(item.name)}
                              title="Share"
                            >
                              <ShareIcon />
                            </button>
                          </>
                        )}
                        <button
                          className="btn-secondary"
                          style={{
                            padding: 6,
                            minHeight: 30,
                            borderRadius: 6,
                            color: '#ef4444',
                            borderColor: 'transparent'
                          }}
                          onClick={() => handleDeleteItem(item)}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 5: Configure Supabase Alert ────────────────────────── */}
        {!isConfigured && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <p style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>⚠️ Storage is Offline</p>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Click the **Settings** button in the top right to configure your Supabase connection credentials and initialize storage.
            </p>
          </div>
        )}
      </div>

      {/* ── Floating Merge bar ─────────────────────────────────────────────── */}
      {selectedFiles.length >= 2 && (
        <div
          style={{
            position: 'fixed',
            bottom: 66,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 24px)',
            maxWidth: 456,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            zIndex: 49,
            animation: 'sheet-up 0.2s ease-out',
            color: '#f8fafc'
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            ⚡ {selectedFiles.length} PDFs selected
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                minHeight: 34,
                fontSize: 12,
                color: '#cbd5e1',
                borderColor: '#475569',
                background: 'transparent'
              }}
              onClick={() => setSelectedFiles([])}
            >
              Clear
            </button>
            <button
              className="btn-primary"
              style={{
                padding: '6px 14px',
                minHeight: 34,
                fontSize: 12,
                background: '#6366f1',
                color: '#ffffff',
                border: 'none'
              }}
              onClick={triggerPDFMergeClick}
            >
              Merge PDFs
            </button>
          </div>
        </div>
      )}

      {/* ── PDF Merge Filename Modal ───────────────────────────────────────── */}
      {showMergeModal && (
        <div className="modal-overlay" onClick={() => setShowMergeModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
              Name Merged PDF
            </h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
              Enter a filename for the merged PDF. It will be saved in the current folder and downloaded to your device.
            </p>

            <div style={{ marginBottom: 18 }}>
              <label className="field-label" style={{ color: '#475569', marginBottom: 6 }}>Merged Filename</label>
              <input
                className="field-input"
                value={mergedName}
                onChange={(ev) => handleMergedNameChange(ev.target.value)}
                placeholder="e.g. MERGED_INVOICES"
                autoFocus
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  borderColor: mergedNameError ? '#ef4444' : '#cbd5e1',
                  boxShadow: mergedNameError ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none'
                }}
              />
              <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>
                Extension <code style={{ fontFamily: 'monospace' }}>.pdf</code> will be added automatically.
              </span>
              {mergedNameError && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 5, fontWeight: 500 }}>
                  {mergedNameError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, minHeight: 44 }}
                onClick={() => setShowMergeModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{
                  flex: 2,
                  minHeight: 44,
                  background: mergedNameError || !mergedName.trim() ? '#94a3b8' : '#6366f1',
                  border: 'none',
                  color: '#ffffff'
                }}
                disabled={!!mergedNameError || !mergedName.trim() || merging}
                onClick={executePDFMerge}
              >
                Confirm & Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
