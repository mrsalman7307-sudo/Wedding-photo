/**
 * Our Nikah Memories - Admin Control Center Engine
 * Pure Vanilla JavaScript (ES6+)
 * Handles administrator authentication, statistics visualization, member management (CRUD),
 * access logs audit with selfie preview modal, and security settings.
 * Supports both Express server and Netlify static hosting via localData hybrid layer.
 */

import { saveAdminSession, getAdminToken, clearAdminSession, requireAdminAccess } from './auth.js';
import { showToast, openModal, closeModal, soundFX } from './app.js';
import { subscribeToSelfies } from './firebase.js';
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
          }, 300);
        } else {
          // If login failed, check if credentials match fallback directly
          const cleanEmail = email.trim().toLowerCase();
          const cleanPass = password.trim();
          if (
            (cleanEmail === 'ahmadsalman9939@gmail.com' || cleanEmail.includes('ahmadsalman9939') || cleanEmail === 'admin') &&
            (cleanPass === 'admin@123' || cleanPass === 'Admin@123')
          ) {
            const adminToken = 'adm_local_' + Date.now();
            const user = { email: 'ahmadsalman9939@gmail.com', role: 'admin', name: 'Ahmad Salman' };
            saveAdminSession(adminToken, user, rememberCheckbox?.checked);
            showToast('Welcome back, Admin!', 'success');
            soundFX.playChime();
            setTimeout(() => {
              window.location.href = '/pages/admin-dashboard.html';
            }, 300);
            return;
          }

          if (alertBox) {
            alertBox.style.display = 'flex';
            alertBox.textContent = result.error || 'Invalid admin credentials. Please use: ahmadsalman9939@gmail.com / admin@123';
          }
          loginBtn.disabled = false;
          loginBtn.innerHTML = 'Sign In to Dashboard';
        }
      } catch (err) {
        console.warn('Login attempt encountered error, checking fallback:', err);
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = password.trim();
        if (
          (cleanEmail === 'ahmadsalman9939@gmail.com' || cleanEmail.includes('ahmadsalman9939') || cleanEmail === 'admin') &&
          (cleanPass === 'admin@123' || cleanPass === 'Admin@123')
        ) {
          const adminToken = 'adm_local_' + Date.now();
          const user = { email: 'ahmadsalman9939@gmail.com', role: 'admin', name: 'Ahmad Salman' };
          saveAdminSession(adminToken, user, rememberCheckbox?.checked);
          showToast('Welcome back, Admin!', 'success');
          soundFX.playChime();
          setTimeout(() => {
            window.location.href = '/pages/admin-dashboard.html';
          }, 300);
          return;
        }

        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.textContent = 'Invalid credentials. Please enter email: ahmadsalman9939@gmail.com and password: admin@123';
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

    const recentLogs = data.recentLogs || [];

    function renderDashboardRecentLogs(logs) {
      // Render 1: Dedicated Bada Selfie Cards Grid
      const cardsGrid = document.getElementById('adminSelfieCardsGrid');
      if (cardsGrid) {
        if (!logs || logs.length === 0) {
          cardsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--color-text-muted); background: var(--color-surface-glass); border: 1px dashed var(--color-border-gold); border-radius: var(--radius-md);">
              Abhi tak kisi guest ne selfie submit nahi ki hai. Guests verification ke baad badi photos yahan live dikhengi.
            </div>
          `;
        } else {
          cardsGrid.innerHTML = logs
            .map(
              (log) => `
              <div class="selfie-bada-card">
                <div class="selfie-bada-img-wrap" onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}', '${log.folderName}', '${log.timestamp}', '${log.phone || ''}', '${log.deviceInfo || ''}')">
                  <img src="${log.selfieImage}" alt="${log.name}" class="selfie-bada-img" loading="lazy" />
                  <div class="selfie-bada-overlay">
                    <span class="selfie-bada-badge">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Bada Dekhein
                    </span>
                  </div>
                </div>
                <div class="selfie-bada-info">
                  <div class="selfie-bada-name">${log.name}</div>
                  <div class="selfie-bada-phone">
                    <span>📱</span>
                    <code>${log.phone || '—'}</code>
                  </div>
                  <div class="selfie-bada-meta">
                    <span class="perm-tag">${log.folderName}</span>
                    <span style="font-size:0.75rem;">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button 
                    type="button" 
                    class="btn-gold selfie-bada-btn" 
                    onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}', '${log.folderName}', '${log.timestamp}', '${log.phone || ''}', '${log.deviceInfo || ''}')"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>Full Size Bada Dekhein</span>
                  </button>
                </div>
              </div>
            `
            )
            .join('');
        }
      }

      // Render 2: Detailed Table View
      const recentLogsTable = document.getElementById('adminRecentLogsBody');
      if (recentLogsTable) {
        if (!logs || logs.length === 0) {
          recentLogsTable.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--color-text-muted);">No guest access records logged yet.</td></tr>`;
        } else {
          recentLogsTable.innerHTML = logs
            .map(
              (log) => `
              <tr>
                <td>
                  <div class="table-selfie-thumb-wrap" onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}', '${log.folderName}', '${log.timestamp}', '${log.phone || ''}', '${log.deviceInfo || ''}')">
                    <img src="${log.selfieImage}" alt="${log.name}" class="table-selfie-thumb" />
                    <div class="table-selfie-zoom-hint">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight:700; color:var(--color-ivory); font-size:0.95rem;">${log.name}</div>
                  <div style="font-size:0.8rem; color:var(--color-text-muted);">${log.email || '—'}</div>
                </td>
                <td><code style="color:var(--color-gold); font-weight:600;">${log.phone || '—'}</code></td>
                <td><span class="perm-tag">${log.folderName}</span></td>
                <td style="font-size:0.85rem; color:var(--color-text-secondary);">${new Date(log.timestamp).toLocaleString()}</td>
                <td>
                  <span class="status-badge active">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="#10B981"><circle cx="5" cy="5" r="5"/></svg>
                    ${log.status || 'Granted'}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn-outline-gold" 
                    style="padding:0.35rem 0.75rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem;" 
                    onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}', '${log.folderName}', '${log.timestamp}', '${log.phone || ''}', '${log.deviceInfo || ''}')"
                  >
                    🔍 Bada Dekhein
                  </button>
                </td>
              </tr>
            `
            )
            .join('');
        }
      }
    }

    renderDashboardRecentLogs(recentLogs);

    // Live cross-device real-time listener from Firebase Firestore
    try {
      subscribeToSelfies((liveLogs) => {
        if (Array.isArray(liveLogs) && liveLogs.length > 0) {
          if (statRecords) statRecords.textContent = liveLogs.length.toString();
          renderDashboardRecentLogs(liveLogs.slice(0, 24));
        }
      });
    } catch (subErr) {
      console.warn('Real-time subscription warning:', subErr);
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

    try {
      subscribeToSelfies((liveLogs) => {
        if (Array.isArray(liveLogs) && liveLogs.length > 0) {
          logsList = liveLogs;
          renderLogs(logsList);
        }
      });
    } catch (subErr) {
      console.warn('Real-time subscription warning in access logs:', subErr);
    }
  } catch {
    showToast('Failed to load access logs.', 'error');
  }

  function renderLogs(items) {
    // 1. Render Bada Selfie Cards Grid
    const cardsGrid = document.getElementById('logsSelfieCardsGrid');
    if (cardsGrid) {
      if (items.length === 0) {
        cardsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--color-text-muted); background: var(--color-surface-glass); border: 1px dashed var(--color-border-gold); border-radius: var(--radius-md);">
            Koi selfie match nahi hui.
          </div>
        `;
      } else {
        cardsGrid.innerHTML = items
          .map(
            (log) => `
            <div class="selfie-bada-card">
              <div class="selfie-bada-img-wrap" onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}', '${log.folderName}', '${log.timestamp}', '${log.phone || ''}', '${log.deviceInfo || ''}')">
                <img src="${log.selfieImage}" alt="${log.name}" class="selfie-bada-img" loading="lazy" />
                <div class="selfie-bada-overlay">
                  <span class="selfie-bada-badge">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Bada Dekhein
                  </span>
                </div>
              </div>
              <div class="selfie-bada-info">
                <div class="selfie-bada-name">${log.name}</div>
                <div class="selfie-bada-phone">
                  <span>📱</span>
                  <code>${log.phone || '—'}</code>
                </div>
                <div class="selfie-bada-meta">
                  <span class="perm-tag">${log.folderName}</span>
                  <span style="font-size:0.75rem;">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button 
                  type="button" 
                  class="btn-gold selfie-bada-btn" 
                  onclick="window.showSelfieModal('${log.selfieImage}', '${log.name}', '${log.folderName}', '${log.timestamp}', '${log.phone || ''}', '${log.deviceInfo || ''}')"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>Full Size Bada Dekhein</span>
                </button>
              </div>
            </div>
          `
          )
          .join('');
      }
    }

    // 2. Render Table View
    if (!tableBody) return;
    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--color-text-muted);">No access records logged yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items
      .map(
        (l) => `
        <tr>
          <td>
            <div class="table-selfie-thumb-wrap" onclick="window.showSelfieModal('${l.selfieImage}', '${l.name}', '${l.folderName}', '${l.timestamp}', '${l.phone || ''}', '${l.deviceInfo || ''}')">
              <img 
                src="${l.selfieImage}" 
                alt="${l.name}" 
                class="table-selfie-thumb"
              />
              <div class="table-selfie-zoom-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--color-ivory); font-size:0.95rem;">${l.name}</div>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">${l.email || '—'}</div>
          </td>
          <td><code style="color:var(--color-gold); font-weight:600;">${l.phone || '—'}</code></td>
          <td><span class="perm-tag">${l.folderName}</span></td>
          <td style="font-size:0.85rem; color:var(--color-text-secondary);">${new Date(l.timestamp).toLocaleString()}</td>
          <td style="font-size:0.8rem; color:var(--color-text-muted); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${l.deviceInfo}
          </td>
          <td>
            <span class="status-badge active">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="#10B981"><circle cx="5" cy="5" r="5"/></svg>
              ${l.status || 'Granted'}
            </span>
          </td>
          <td>
            <button 
              class="btn-outline-gold" 
              style="padding:0.35rem 0.75rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem;" 
              onclick="window.showSelfieModal('${l.selfieImage}', '${l.name}', '${l.folderName}', '${l.timestamp}', '${l.phone || ''}', '${l.deviceInfo || ''}')"
            >
              🔍 Bada Dekhein
            </button>
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

window.showSelfieModal = (imgUrl, name, folder = '', date = '', phone = '', device = '') => {
  const modalImg = document.getElementById('selfieModalImage');
  const modalName = document.getElementById('selfieModalName');
  const modalMeta = document.getElementById('selfieModalMeta');
  const modalDetails = document.getElementById('selfieModalDetails');
  const downloadBtn = document.getElementById('selfieModalDownloadBtn');

  if (modalImg) modalImg.src = imgUrl;
  if (modalName) modalName.textContent = name;
  if (modalMeta) {
    modalMeta.textContent = `${folder ? folder + ' · ' : ''}${date ? new Date(date).toLocaleString() : ''}`;
  }

  if (modalDetails) {
    modalDetails.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; margin-top:0.6rem; font-size:0.85rem;">
        ${phone ? `<span class="perm-tag" style="background:rgba(212,175,55,0.2);">📱 ${phone}</span>` : ''}
        ${folder ? `<span class="perm-tag">📁 ${folder}</span>` : ''}
        ${date ? `<span class="perm-tag">⏰ ${new Date(date).toLocaleTimeString()}</span>` : ''}
        ${device ? `<span class="perm-tag" style="max-width:280px; overflow:hidden; text-overflow:ellipsis;">💻 ${device}</span>` : ''}
      </div>
    `;
  }

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = `Selfie_${(name || 'guest').replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      a.click();
    };
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
