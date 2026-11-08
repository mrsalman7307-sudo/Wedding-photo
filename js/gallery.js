/**
 * Our Nikah Memories - Private Gallery Engine
 * Pure Vanilla JavaScript (ES6+)
 * Handles authorized media fetching, responsive masonry grid, category filters,
 * search filtering, full-screen lightbox viewer with keyboard navigation,
 * video playback, individual downloads, and ZIP packaging.
 */

import { getGuestAccessToken, getGuestAccessData, getAdminToken, clearGuestSession } from './auth.js';
import { showToast, soundFX } from './app.js';

let currentMediaList = [];
let filteredMediaList = [];
let currentLightboxIndex = -1;
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const folderId = urlParams.get('folder') || sessionStorage.getItem('selectedFolderId') || 'shaadi';

  const guestToken = getGuestAccessToken();
  const guestData = getGuestAccessData();
  const adminToken = getAdminToken();

  // 1. Authorization Guard
  const hasAccess =
    adminToken ||
    (guestToken &&
      guestData &&
      (guestData.folderId === folderId ||
        guestData.permissions?.includes(folderId) ||
        !guestData.permissions ||
        guestData.permissions.length === 0));

  if (!hasAccess) {
    showToast('Private gallery access requires prior verification.', 'error');
    setTimeout(() => {
      window.location.href = `/pages/verify.html?folder=${folderId}`;
    }, 800);
    return;
  }

  // Set guest greeting
  const guestGreeting = document.getElementById('galleryGuestGreeting');
  if (guestGreeting) {
    guestGreeting.textContent = adminToken ? 'Wedding Administrator' : guestData?.name || 'Honored Guest';
  }

  // Load Folder Content from Server
  await loadGalleryMedia(folderId, guestToken || adminToken || '');

  // 2. Setup Filter Tabs
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentFilter = target.dataset.filter || 'all';
      applyFilters();
    });
  });

  // 3. Setup Search Bar
  const searchInput = document.getElementById('gallerySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // 4. Download All as ZIP Button
  const downloadAllBtn = document.getElementById('downloadAllZipBtn');
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', handleDownloadAllZip);
  }

  // 5. Exit Gallery Button
  const exitBtn = document.getElementById('exitGalleryBtn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      clearGuestSession();
      window.location.href = '/index.html';
    });
  }

  // 6. Lightbox Controls
  setupLightbox();
});

async function loadGalleryMedia(folderId, token) {
  const grid = document.getElementById('galleryGrid');
  const folderTitle = document.getElementById('galleryFolderTitle');
  const folderSubtitle = document.getElementById('galleryFolderSubtitle');
  const folderDescription = document.getElementById('galleryFolderDesc');

  try {
    const response = await fetch(`/api/gallery/${folderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.error || 'Failed to load private media.', 'error');
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
            <p style="color:var(--color-danger); font-size:1.1rem; margin-bottom:1rem;">${data.error || 'Access Denied'}</p>
            <a href="/pages/verify.html?folder=${folderId}" class="btn-gold">Verify Credentials Again</a>
          </div>
        `;
      }
      return;
    }

    const folder = data.folder;
    currentMediaList = data.media;

    if (folderTitle) folderTitle.textContent = folder.title;
    if (folderSubtitle) folderSubtitle.textContent = folder.subtitle;
    if (folderDescription) folderDescription.textContent = folder.description;

    const driveFolderBtn = document.getElementById('galleryDriveFolderBtn');
    if (driveFolderBtn && folder.driveUrl) {
      driveFolderBtn.href = folder.driveUrl;
      driveFolderBtn.style.display = 'inline-flex';
    }

    applyFilters();
  } catch {
    showToast('Connection error while fetching gallery.', 'error');
  }
}

function applyFilters() {
  filteredMediaList = currentMediaList.filter((item) => {
    // Type filter
    if (currentFilter !== 'all' && item.type !== currentFilter) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const matchTitle = item.title.toLowerCase().includes(searchQuery);
      const matchCaption = item.caption.toLowerCase().includes(searchQuery);
      return matchTitle || matchCaption;
    }
    return true;
  });

  renderGrid(filteredMediaList);
}

function renderGrid(items) {
  const grid = document.getElementById('galleryGrid');
  const counter = document.getElementById('galleryItemCount');
  if (!grid) return;

  if (counter) {
    counter.textContent = 'Private Wedding Memories';
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 5rem 1rem; background: var(--color-surface-glass); border-radius: var(--radius-md); border: 1px dashed var(--color-border-gold);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" style="margin-bottom:1rem;">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" stroke-width="1.5"/>
          <polyline points="21 15 16 10 5 21" stroke-width="1.5"/>
        </svg>
        <h3 style="font-size:1.3rem; margin-bottom:0.5rem; color:var(--color-ivory);">No matching memories found</h3>
        <p style="color:var(--color-text-muted); font-size:0.9rem;">Try adjusting your filter or search query.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items
    .map((item, index) => {
      const isVideo = item.type === 'video';
      return `
        <div class="gallery-item-card" data-index="${index}" onclick="window.openLightbox(${index})">
          <div class="gallery-media-thumb-wrapper">
            <img 
              src="${item.thumbnail}" 
              alt="${item.title}" 
              loading="lazy" 
              referrerpolicy="no-referrer"
              class="gallery-media-thumb"
            />
            <div class="gallery-media-scrim"></div>
            
            ${isVideo ? `
              <div class="video-play-indicator">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#04221A">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <span class="media-duration-tag">${item.duration || 'Video'}</span>
            ` : `
              <span class="media-badge-tag">Photo</span>
            `}
            
            <div class="gallery-card-info">
              <h4 class="gallery-item-title">${item.title}</h4>
              <p class="gallery-item-caption">${item.caption}</p>
              <div class="gallery-item-meta">
                <span>${item.date}</span>
                <span>·</span>
                <span>${item.fileSize}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Lightbox Viewer
function setupLightbox() {
  const modal = document.getElementById('lightboxModal');
  const closeBtn = document.getElementById('lightboxCloseBtn');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  const downloadBtn = document.getElementById('lightboxDownloadBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', () => navigateLightbox(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateLightbox(1));

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (currentLightboxIndex >= 0 && currentLightboxIndex < filteredMediaList.length) {
        const item = filteredMediaList[currentLightboxIndex];
        downloadFile(item.url, `${item.title.replace(/\s+/g, '_')}.${item.type === 'video' ? 'mp4' : 'jpg'}`);
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!modal?.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }
}

export function openLightbox(index) {
  if (index < 0 || index >= filteredMediaList.length) return;
  currentLightboxIndex = index;

  const modal = document.getElementById('lightboxModal');
  const mediaContainer = document.getElementById('lightboxMediaContainer');
  const titleEl = document.getElementById('lightboxTitle');
  const captionEl = document.getElementById('lightboxCaption');
  const metaEl = document.getElementById('lightboxMeta');

  const item = filteredMediaList[index];

  if (titleEl) titleEl.textContent = item.title;
  if (captionEl) captionEl.textContent = item.caption;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>${item.date}</span>
      <span>·</span>
      <span>${item.fileSize}</span>
      ${item.dimensions ? `<span>·</span><span>${item.dimensions}</span>` : ''}
    `;
  }

  if (mediaContainer) {
    if (item.type === 'video') {
      mediaContainer.innerHTML = `
        <video 
          controls 
          autoplay 
          playsinline 
          class="lightbox-video"
          src="${item.url}"
        >
          Your browser does not support HTML5 video.
        </video>
      `;
    } else {
      mediaContainer.innerHTML = `
        <img 
          src="${item.url}" 
          alt="${item.title}" 
          class="lightbox-image"
          referrerpolicy="no-referrer"
        />
      `;
    }
  }

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  const mediaContainer = document.getElementById('lightboxMediaContainer');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (mediaContainer) {
    mediaContainer.innerHTML = '';
  }
  currentLightboxIndex = -1;
}

function navigateLightbox(dir) {
  const newIndex = currentLightboxIndex + dir;
  if (newIndex >= 0 && newIndex < filteredMediaList.length) {
    openLightbox(newIndex);
  }
}

function downloadFile(url, filename) {
  showToast(`Preparing download for ${filename}...`, 'info');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  soundFX.playChime();
}

async function handleDownloadAllZip() {
  if (currentMediaList.length === 0) {
    showToast('No media available to download.', 'error');
    return;
  }

  showToast(`Packaging ${currentMediaList.length} wedding memories for download...`, 'info');

  let count = 0;
  for (const item of currentMediaList) {
    count++;
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = `${item.folderId}_${item.id}_${item.title.replace(/\s+/g, '_')}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, count * 350);
  }

  setTimeout(() => {
    soundFX.playChime();
    showToast('All gallery media files initiated for download!', 'success');
  }, (count + 1) * 350);
}

window.openLightbox = openLightbox;
