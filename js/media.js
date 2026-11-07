/**
 * Our Nikah Memories - Media Manager Engine
 * Pure Vanilla JavaScript (ES6+)
 * Handles media uploads, drag & drop, folder assignments, media deletion, and storage calculation
 */

import { getAdminToken, requireAdminAccess } from './auth.js';
import { showToast, soundFX } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAdminAccess()) return;
  const token = getAdminToken() || '';

  const dropzone = document.getElementById('mediaUploadDropzone');
  const fileInput = document.getElementById('mediaFileInput');
  const folderSelect = document.getElementById('mediaFolderSelect');
  const mediaGrid = document.getElementById('adminMediaGrid');
  const filterFolderSelect = document.getElementById('filterMediaByFolder');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressWrapper = document.getElementById('uploadProgressWrapper');

  let currentMedia = [];

  async function loadMedia(folder = '') {
    try {
      const res = await fetch(`/api/admin/media${folder ? '?folder=' + folder : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        currentMedia = data.media;
        renderMedia(currentMedia);
      }
    } catch {
      showToast('Error loading media items.', 'error');
    }
  }

  function renderMedia(items) {
    if (!mediaGrid) return;
    if (items.length === 0) {
      mediaGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--color-text-muted);">
          No media in this folder. Upload new photos or videos above.
        </div>
      `;
      return;
    }

    mediaGrid.innerHTML = items
      .map(
        (m) => `
        <div class="glass-card" style="padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
          <div style="position:relative; width:100%; height:180px; border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--color-border-gold);">
            <img 
              src="${m.thumbnail}" 
              alt="${m.title}" 
              style="width:100%; height:100%; object-fit:cover;"
              referrerpolicy="no-referrer"
            />
            <span class="folder-badge" style="top:0.5rem; right:0.5rem; font-size:0.7rem;">
              ${m.folderId.toUpperCase()} · ${m.type.toUpperCase()}
            </span>
          </div>
          <div>
            <h4 style="font-size:1.05rem; color:var(--color-ivory); margin-bottom:0.25rem;">${m.title}</h4>
            <p style="font-size:0.8rem; color:var(--color-text-muted); line-height:1.4;">${m.caption || 'No caption'}</p>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.5rem; border-top:1px solid rgba(212, 175, 55, 0.15);">
            <span style="font-size:0.8rem; color:var(--color-gold);">${m.fileSize}</span>
            <button 
              class="btn-outline-gold" 
              style="padding:0.35rem 0.7rem; font-size:0.78rem; border-color:rgba(239,68,68,0.5); color:#FCA5A5;" 
              onclick="window.deleteAdminMedia('${m.id}', '${m.title}')"
            >
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join('');
  }

  if (filterFolderSelect) {
    filterFolderSelect.addEventListener('change', () => {
      loadMedia(filterFolderSelect.value);
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFilesUpload(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleFilesUpload(fileInput.files);
      }
    });
  }

  async function handleFilesUpload(fileList) {
    const folderId = folderSelect?.value || 'shaadi';
    const file = fileList[0];
    if (!file) return;

    if (uploadProgressWrapper && uploadProgressBar) {
      uploadProgressWrapper.style.display = 'block';
      uploadProgressBar.style.width = '0%';
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result;
      const isVideo = file.type.startsWith('video');

      let prog = 10;
      const interval = setInterval(() => {
        prog += 20;
        if (uploadProgressBar) uploadProgressBar.style.width = `${Math.min(prog, 90)}%`;
        if (prog >= 90) clearInterval(interval);
      }, 100);

      try {
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');

        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            folderId,
            type: isVideo ? 'video' : 'photo',
            title: title.charAt(0).toUpperCase() + title.slice(1),
            caption: `Uploaded wedding moment in ${folderId}.`,
            url: dataUrl,
            thumbnail: dataUrl,
            fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          }),
        });

        clearInterval(interval);
        if (uploadProgressBar) uploadProgressBar.style.width = '100%';

        const data = await res.json();
        if (res.ok && data.success) {
          soundFX.playChime();
          showToast(`Media "${title}" successfully added!`, 'success');
          setTimeout(() => {
            if (uploadProgressWrapper) uploadProgressWrapper.style.display = 'none';
          }, 600);
          await loadMedia(folderSelect.value);
        } else {
          showToast(data.error || 'Upload failed.', 'error');
        }
      } catch {
        showToast('Error uploading media to server.', 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  await loadMedia();
});

window.deleteAdminMedia = async (id, title) => {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
  const token = getAdminToken() || '';

  try {
    const res = await fetch(`/api/admin/media/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Media removed.', 'info');
      const select = document.getElementById('filterMediaByFolder');
      const folder = select ? select.value : '';
      const refreshRes = await fetch(`/api/admin/media${folder ? '?folder=' + folder : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.success) {
        window.location.reload();
      }
    }
  } catch {
    showToast('Failed to delete media.', 'error');
  }
};
