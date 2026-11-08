/**
 * Our Nikah Memories - Admin Control Center Engine
 * Pure Vanilla JavaScript (ES6+)
 * Handles administrator authentication, statistics visualization, member management (CRUD),
 * access logs audit with selfie preview modal, and security settings.
 * Supports both Express server and Netlify static hosting via localData hybrid layer.
 */

import { getAdminToken, clearAdminSession, requireAdminAccess } from './auth.js';
import { showToast, openModal, closeModal, soundFX } from './app.js';
import {
  apiAdminLogin,
  apiGetStats,
  apiGetMembers,
  apiAddMember,
  apiDeleteMember,
  apiToggleMember,
  apiGetLogs,
} from './localData.js';

// 1. Admin Login Page Controller
export function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const rememberCheckbox = document.getElementById('rememberMe');
  const loginBtn = document.getElementById('adminLoginSubmitBtn');
  const alertBox = document.getElementById('adminLoginAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (alertBox) alertBox.style.display = 'none';

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.textContent = 'Please enter both admin email and password.';
        }
        return;
      }

      loginBtn.disabled = true;
      loginBtn.innerHTML = 'Authenticating...';

      try {
        const result = await apiAdminLogin(email, password, rememberCheckbox?.checked);

        if (result.success) {
          showToast('Welcome back, Admin!', 'success');
          soundFX.playChime();
          setTimeout(() => {
            window.location.href = '/pages/admin-dashboard.html';
          }, 400);
        } else {
          if (alertBox) {
            alertBox.style.display = 'flex';
            alertBox.textContent = result.error || 'Invalid admin credentials.';
          }
          loginBtn.disabled = false;
          loginBtn.innerHTML = 'Sign In to Dashboard';
        }
      } catch {
        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.textContent = 'Authentication error. Please check your credentials.';
        }
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Sign In to Dashboard';
      }
    });
  }
}

// 2. Admin Dashboard Page Controller
export async function initAdminDashboard() {
  if (!requireAdminAccess()) return;

  try {
    const data = await apiGetStats();

    if (!data.success) {
      clearAdminSession();
      window.location.href = '/pages/admin-login.html';
      return;
    }

    const statMembers = document.getElementById('statTotalMembers');
    const statRecords = document.getElementById('statTotalRecords');
    const statPhotos = document.getElementById('statTotalPhotos');
    const statVideos = document.getElementById('statTotalVideos');
    const statStorage = document.getElementById('statTotalStorage');

    if (statMembers) statMembers.textContent = data.stats.totalMembers.toString();
    if (statRecords) statRecords.textContent = data.stats.totalAccessRecords.toString();
    if (statPhotos) statPhotos.textContent = data.stats.totalPhotos.toString();
    if (statVideos) statVideos.textContent = data.stats.totalVideos.toString();
    if (statStorage) statStorage.textContent = data.stats.totalStorageUsed;

    const recentLogsTable = document.getElementById('adminRecentLogsBody');
    if (recentLogsTable) {
      recentLogsTable.innerHTML = (data.recentLogs || [])
        .map(
          (log) => `
          <tr>
            <td>
              <img 
                src="${log.selfieImage}" 
                alt="Selfie" 
                class="table-selfie-thumb" 
                onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}')" 
              />
            </td>
            <td>
              <div style="font-weight:600; color:var(--color-primary);">${log.name}</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted);">${log.email || '—'}</div>
            </td>
            <td>
              <span class="perm-tag">${log.folderName}</span>
            </td>
            <td style="font-size:0.85rem;">
              ${new Date(log.timestamp).toLocaleString()}
            </td>
            <td>
              <span class="status-badge active">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="#10B981"><circle cx="5" cy="5" r="5"/></svg>
                ${log.status}
              </span>
            </td>
          </tr>
        `
        )
        .join('');
    }
  } catch {
    showToast('Failed to load admin stats.', 'error');
  }
}

// 3. Admin Members Page Controller
let cachedMembers = [];

export async function initAdminMembers() {
  if (!requireAdminAccess()) return;

  const tableBody = document.getElementById('membersTableBody');
  const searchInput = document.getElementById('membersSearchInput');
  const addMemberForm = document.getElementById('addMemberForm');
  const openAddModalBtn = document.getElementById('openAddMemberModalBtn');
  const addModal = document.getElementById('addMemberModal');

  async function loadMembers() {
    try {
      const data = await apiGetMembers();
      if (data.success) {
        cachedMembers = data.members;
        renderMembers(cachedMembers);
      }
    } catch {
      showToast('Error loading approved members.', 'error');
    }
  }

  function renderMembers(list) {
    if (!tableBody) return;
    if (list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--color-text-muted);">No members found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map(
        (m) => `
        <tr>
          <td>
            <div style="font-weight:600; color:var(--color-primary);">${m.name}</div>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">Added: ${new Date(m.createdAt).toLocaleDateString()}</div>
          </td>
          <td><code style="color:var(--color-primary); font-weight:600;">${m.phone}</code></td>
          <td>${m.email || '<span style="color:var(--color-text-muted); font-size:0.8rem;">—</span>'}</td>
          <td>
            ${(m.permissions || []).map((p) => `<span class="perm-tag">${p}</span>`).join('')}
          </td>
          <td>
            <span class="status-badge ${m.status}">
              ${m.status === 'active' ? 'Active' : 'Disabled'}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:0.5rem;">
              <button 
                class="btn-outline-gold" 
                style="padding:0.35rem 0.6rem; font-size:0.78rem;" 
                onclick="window.toggleMemberStatus('${m.id}')"
              >
                ${m.status === 'active' ? 'Disable' : 'Enable'}
              </button>
              <button 
                class="btn-outline-gold" 
                style="padding:0.35rem 0.6rem; font-size:0.78rem; border-color:rgba(239, 68, 68, 0.5); color:#EF4444;" 
                onclick="window.deleteMember('${m.id}', '${m.name}')"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = cachedMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          m.phone.includes(q)
      );
      renderMembers(filtered);
    });
  }

  if (openAddModalBtn && addModal) {
    openAddModalBtn.addEventListener('click', () => openModal('addMemberModal'));
  }

  if (addMemberForm) {
    addMemberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newMemberName').value.trim();
      const emailInput = document.getElementById('newMemberEmail');
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = document.getElementById('newMemberPhone').value.trim();

      const checkedPerms = Array.from(
        document.querySelectorAll('input[name="newMemberPerms"]:checked')
      ).map((el) => el.value);

      const perms = checkedPerms.length > 0 ? checkedPerms : ['shaadi', 'walima', 'ghar', 'vlog'];

      try {
        const res = await apiAddMember({
          name,
          email,
          phone,
          permissions: perms,
        });

        if (res.success) {
          showToast(`Member ${name} added successfully!`, 'success');
          closeModal('addMemberModal');
          addMemberForm.reset();
          await loadMembers();
        } else {
          showToast(res.error || 'Failed to add member.', 'error');
        }
      } catch {
        showToast('Error saving member.', 'error');
      }
    });
  }

  await loadMembers();
}

// 4. Admin Access Logs Page Controller
export async function initAdminAccessLogs() {
  if (!requireAdminAccess()) return;

  const tableBody = document.getElementById('accessLogsTableBody');
  const searchInput = document.getElementById('logsSearchInput');
  const exportCsvBtn = document.getElementById('exportLogsCsvBtn');

  let logsList = [];

  try {
    const data = await apiGetLogs();
    if (data.success) {
      logsList = data.logs;
      renderLogs(logsList);
    }
  } catch {
    showToast('Failed to load access logs.', 'error');
  }

  function renderLogs(items) {
    if (!tableBody) return;
    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--color-text-muted);">No access records logged yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items
      .map(
        (l) => `
        <tr>
          <td>
            <img 
              src="${l.selfieImage}" 
              alt="${l.name}" 
              class="table-selfie-thumb"
              onclick="window.showSelfieModal('${l.selfieImage}', '${l.name}', '${l.folderName}', '${l.timestamp}')"
            />
          </td>
          <td>
            <div style="font-weight:600; color:var(--color-primary);">${l.name}</div>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">${l.email || '—'}</div>
          </td>
          <td><code style="color:var(--color-primary); font-weight:600;">${l.phone}</code></td>
          <td><span class="perm-tag">${l.folderName}</span></td>
          <td style="font-size:0.85rem;">${new Date(l.timestamp).toLocaleString()}</td>
          <td style="font-size:0.8rem; color:var(--color-text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${l.deviceInfo}
          </td>
          <td>
            <span class="status-badge active">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="#10B981"><circle cx="5" cy="5" r="5"/></svg>
              ${l.status}
            </span>
          </td>
        </tr>
      `
      )
      .join('');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = logsList.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          l.phone.includes(q) ||
          l.folderName.toLowerCase().includes(q)
      );
      renderLogs(filtered);
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (logsList.length === 0) {
        showToast('No logs to export.', 'error');
        return;
      }

      const headers = ['ID', 'Name', 'Email', 'Phone', 'Folder', 'Timestamp', 'Device', 'Status'];
      const rows = logsList.map((l) => [
        l.id,
        `"${l.name}"`,
        l.email,
        l.phone,
        `"${l.folderName}"`,
        l.timestamp,
        `"${(l.deviceInfo || '').replace(/"/g, '""')}"`,
        l.status,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Nikah_Memories_Access_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      soundFX.playChime();
      showToast('Audit log CSV exported successfully!', 'success');
    });
  }
}

window.showSelfieModal = (imgUrl, name, folder = '', date = '') => {
  const modalImg = document.getElementById('selfieModalImage');
  const modalName = document.getElementById('selfieModalName');
  const modalMeta = document.getElementById('selfieModalMeta');

  if (modalImg) modalImg.src = imgUrl;
  if (modalName) modalName.textContent = name;
  if (modalMeta) {
    modalMeta.textContent = `${folder ? folder + ' · ' : ''}${date ? new Date(date).toLocaleString() : ''}`;
  }

  openModal('selfiePreviewModal');
};

window.toggleMemberStatus = async (id) => {
  try {
    const res = await apiToggleMember(id);
    if (res.success) {
      showToast(`Member is now ${res.member.status}.`, 'info');
      initAdminMembers();
    }
  } catch {
    showToast('Failed to toggle member status.', 'error');
  }
};

window.deleteMember = async (id, name) => {
  if (!confirm(`Are you sure you want to remove ${name} from approved members?`)) return;
  try {
    const res = await apiDeleteMember(id);
    if (res.success) {
      showToast(`Member ${name} deleted.`, 'info');
      initAdminMembers();
    }
  } catch {
    showToast('Failed to delete member.', 'error');
  }
};

window.logoutAdmin = () => {
  clearAdminSession();
  showToast('Admin logged out.', 'info');
  setTimeout(() => {
    window.location.href = '/pages/admin-login.html';
  }, 400);
};
