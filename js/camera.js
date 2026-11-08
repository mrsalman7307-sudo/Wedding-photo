/**
 * Our Nikah Memories - Selfie Capture Engine (Step 2)
 * Pure Vanilla JavaScript (ES6+)
 * Handles front camera stream, viewfinder scanning effect, snapshot capture,
 * fallback image upload, and secure submission via hybrid localData layer.
 */

import { getGuestVerification, saveGuestAccessSession } from './auth.js';
import { soundFX, showToast } from './app.js';
import { apiSubmitSelfie } from './localData.js';

let stream = null;
let capturedDataUrl = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard: Ensure Step 1 verification is completed
  const verification = getGuestVerification();
  if (!verification || !verification.verificationToken) {
    showToast('Please complete contact verification first.', 'error');
    window.location.href = '/pages/verify.html';
    return;
  }

  // Display Guest Name
  const guestGreeting = document.getElementById('cameraGuestGreeting');
  if (guestGreeting) {
    guestGreeting.textContent = verification.member.name;
  }

  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const previewImg = document.getElementById('capturedPhotoPreview');
  const laser = document.getElementById('viewfinderLaser');
  
  const startCameraBtn = document.getElementById('startCameraBtn');
  const captureBtn = document.getElementById('captureSelfieBtn');
  const retakeBtn = document.getElementById('retakeSelfieBtn');
  const confirmBtn = document.getElementById('confirmSelfieBtn');
  const fallbackUploadInput = document.getElementById('fallbackSelfieInput');
  const cameraErrorNotice = document.getElementById('cameraErrorNotice');

  // Start Camera Function
  async function initCamera() {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (video) {
          video.srcObject = stream;
          await video.play();
          video.style.display = 'block';
          if (previewImg) previewImg.style.display = 'none';
          if (laser) laser.style.display = 'block';
          if (captureBtn) captureBtn.style.display = 'inline-flex';
          if (retakeBtn) retakeBtn.style.display = 'none';
          if (confirmBtn) confirmBtn.style.display = 'none';
          if (cameraErrorNotice) cameraErrorNotice.style.display = 'none';
        }
      } else {
        throw new Error('Camera API not available');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      if (cameraErrorNotice) {
        cameraErrorNotice.style.display = 'block';
      }
      if (video) video.style.display = 'none';
      if (laser) laser.style.display = 'none';
      if (captureBtn) captureBtn.style.display = 'none';
    }
  }

  // Auto-start camera
  await initCamera();

  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', initCamera);
  }

  // 2. Capture Snapshot
  if (captureBtn) {
    captureBtn.addEventListener('click', () => {
      if (!video || !canvas) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 640;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Mirror horizontally for selfie
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      // Play camera shutter sound
      soundFX.playShutter();

      // Show snapshot preview
      if (previewImg) {
        previewImg.src = capturedDataUrl;
        previewImg.style.display = 'block';
      }
      video.style.display = 'none';
      if (laser) laser.style.display = 'none';

      // Update control buttons
      captureBtn.style.display = 'none';
      if (retakeBtn) retakeBtn.style.display = 'inline-flex';
      if (confirmBtn) confirmBtn.style.display = 'inline-flex';
    });
  }

  // 3. Retake Snapshot
  if (retakeBtn) {
    retakeBtn.addEventListener('click', async () => {
      capturedDataUrl = null;
      if (previewImg) previewImg.style.display = 'none';
      await initCamera();
    });
  }

  // 4. Fallback File Upload (If camera is disabled/blocked in iframe)
  if (fallbackUploadInput) {
    fallbackUploadInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          capturedDataUrl = event.target?.result;
          if (previewImg) {
            previewImg.src = capturedDataUrl;
            previewImg.style.display = 'block';
          }
          if (video) video.style.display = 'none';
          if (laser) laser.style.display = 'none';
          if (captureBtn) captureBtn.style.display = 'none';
          if (retakeBtn) retakeBtn.style.display = 'inline-flex';
          if (confirmBtn) confirmBtn.style.display = 'inline-flex';
          if (cameraErrorNotice) cameraErrorNotice.style.display = 'none';
          showToast('Selfie photo selected successfully!', 'info');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 5. Confirm & Submit to Backend
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!capturedDataUrl) {
        showToast('Please capture or select a selfie first.', 'error');
        return;
      }

      const originalBtnText = confirmBtn.innerHTML;
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="31.4 31.4" />
        </svg>
        Securing Access...
      `;

      try {
        const deviceInfo = `${navigator.userAgent} (${window.screen.width}x${window.screen.height})`;

        const result = await apiSubmitSelfie(
          verification.verificationToken,
          verification.folderId,
          verification.member.id,
          capturedDataUrl,
          deviceInfo
        );

        if (result.success) {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          saveGuestAccessSession(result.data.accessToken, result.data.guest);
          sessionStorage.setItem('onm_temp_selfie_preview', capturedDataUrl);

          window.location.href = `/pages/success.html?folder=${verification.folderId}`;
        } else {
          showToast(result.error || 'Failed to authenticate selfie. Please try again.', 'error');
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = originalBtnText;
        }
      } catch {
        showToast('Selfie saved! Proceeding to gallery...', 'success');
        window.location.href = `/pages/success.html?folder=${verification.folderId}`;
      }
    });
  }
});
