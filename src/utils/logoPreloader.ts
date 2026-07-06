/**
 * logoPreloader.ts
 * Preloads the application logo and outputs solid and low-opacity watermark base64 strings in localStorage.
 */

import { defaultLogoBase64 } from '../assets/logoBase64';

export function preloadLogoAndWatermark(logoUrl: string) {
  if (typeof window === 'undefined') return;

  let resolvedUrl = logoUrl;
  if (!resolvedUrl || resolvedUrl.includes('optic_alize_logo') || resolvedUrl.startsWith('/') || resolvedUrl.startsWith('.') || resolvedUrl.startsWith('assets/')) {
    resolvedUrl = defaultLogoBase64;
  }

  const img = new Image();
  if (resolvedUrl && resolvedUrl.startsWith('http')) {
    img.crossOrigin = 'anonymous';
  }
  
  img.onload = () => {
    try {
      // 1. Create solid base64 for header
      const canvasSolid = document.createElement('canvas');
      canvasSolid.width = img.naturalWidth || img.width || 400;
      canvasSolid.height = img.naturalHeight || img.height || 400;
      
      const ctxSolid = canvasSolid.getContext('2d');
      if (ctxSolid) {
        ctxSolid.drawImage(img, 0, 0);
        const base64Solid = canvasSolid.toDataURL('image/jpeg', 0.85);
        localStorage.setItem('optic_app_logo_base64', base64Solid);
      }
      
      // 2. Create low-opacity (watermark) base64
      const canvasWatermark = document.createElement('canvas');
      canvasWatermark.width = 400;
      canvasWatermark.height = 400;
      
      const ctxWatermark = canvasWatermark.getContext('2d');
      if (ctxWatermark) {
        ctxWatermark.clearRect(0, 0, 400, 400);
        ctxWatermark.globalAlpha = 0.06; // low opacity for background watermark
        ctxWatermark.drawImage(img, 0, 0, 400, 400);
        const base64Watermark = canvasWatermark.toDataURL('image/png'); // PNG supports alpha channel
        localStorage.setItem('optic_app_logo_watermark', base64Watermark);
      }
    } catch (e) {
      console.warn('Failed to pre-compute logo base64:', e);
    }
  };
  
  img.onerror = () => {
    // If the image fails to load, create circular default vector logos and save them
    try {
      // Solid vector fallback
      const canvasSolid = document.createElement('canvas');
      canvasSolid.width = 400;
      canvasSolid.height = 400;
      const ctxSolid = canvasSolid.getContext('2d');
      if (ctxSolid) {
        drawDefaultVectorLogo(ctxSolid, 1.0);
        localStorage.setItem('optic_app_logo_base64', canvasSolid.toDataURL('image/png'));
      }
      
      // Watermark vector fallback
      const canvasWatermark = document.createElement('canvas');
      canvasWatermark.width = 400;
      canvasWatermark.height = 400;
      const ctxWatermark = canvasWatermark.getContext('2d');
      if (ctxWatermark) {
        drawDefaultVectorLogo(ctxWatermark, 0.06);
        localStorage.setItem('optic_app_logo_watermark', canvasWatermark.toDataURL('image/png'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  img.src = resolvedUrl;
}

function drawDefaultVectorLogo(ctx: CanvasRenderingContext2D, opacity: number) {
  ctx.clearRect(0, 0, 400, 400);
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Outer circle ring
  ctx.strokeStyle = '#0097a7';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(200, 200, 150, 0, Math.PI * 2);
  ctx.stroke();

  // Eye shape paths
  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.quadraticCurveTo(200, 100, 300, 200);
  ctx.quadraticCurveTo(200, 300, 100, 200);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Iris
  ctx.beginPath();
  ctx.arc(200, 200, 45, 0, Math.PI * 2);
  ctx.fillStyle = '#00bcd4';
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(200, 200, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  
  ctx.restore();
}
