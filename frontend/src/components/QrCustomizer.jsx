import React, { useState, useEffect, useRef } from 'react';
import { Download, Check, Sparkles, X, Palette, Image as ImageIcon, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_PRESETS = [
  { name: 'Classic Slate', hex: '#0f172a' },
  { name: 'Neon Indigo', hex: '#6366f1' },
  { name: 'Vibrant Purple', hex: '#a855f7' },
  { name: 'Neon Pink', hex: '#ec4899' },
  { name: 'Emerald Mint', hex: '#10b981' },
  { name: 'Amber Glow', hex: '#f59e0b' }
];

const LOGO_PRESETS = [
  { id: 'none', label: 'No Logo' },
  { id: 'link', label: 'Link Icon' },
  { id: 'marketing', label: 'Campaign Star' },
  { id: 'qr', label: 'QR Emblem' }
];

const QrCustomizer = ({ isOpen, onClose, qrCodeDataUrl, shortCode, onSaveStyle }) => {
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [selectedLogo, setSelectedLogo] = useState('none');
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !qrCodeDataUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const baseImage = new Image();
    baseImage.src = qrCodeDataUrl;
    baseImage.crossOrigin = 'anonymous';

    baseImage.onload = () => {
      // Clear and draw original QR
      ctx.clearRect(0, 0, 350, 350);
      ctx.drawImage(baseImage, 0, 0, 350, 350);

      // 1. TINT DARK PIXELS
      if (selectedColor !== '#0f172a') {
        const r = parseInt(selectedColor.slice(1, 3), 16);
        const g = parseInt(selectedColor.slice(3, 5), 16);
        const b = parseInt(selectedColor.slice(5, 7), 16);

        const imgData = ctx.getImageData(0, 0, 350, 350);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          // If it is a dark module pixel
          if (data[i] < 120 && data[i + 1] < 120 && data[i + 2] < 120 && data[i + 3] > 100) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // 2. DRAW CENTER BRAND LOGO
      if (selectedLogo !== 'none') {
        const logoSize = 64;
        const cx = (350 - logoSize) / 2;

        // Draw white rounded background plate
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        // Canvas roundRect support
        if (ctx.roundRect) {
          ctx.roundRect(cx - 6, cx - 6, logoSize + 12, logoSize + 12, 14);
        } else {
          ctx.rect(cx - 6, cx - 6, logoSize + 12, logoSize + 12);
        }
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw colored inner circle
        ctx.fillStyle = selectedColor;
        ctx.beginPath();
        ctx.arc(175, 175, logoSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw vector emblem symbols in center
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (selectedLogo === 'link') {
          // Draw standard Link chains
          ctx.beginPath();
          // left loop
          ctx.arc(168, 178, 6, 0.75 * Math.PI, 1.75 * Math.PI);
          // right loop
          ctx.arc(182, 172, 6, -0.25 * Math.PI, 0.75 * Math.PI);
          // center link line
          ctx.moveTo(172, 176);
          ctx.lineTo(178, 170);
          ctx.stroke();
        } else if (selectedLogo === 'marketing') {
          // Draw a Sparkle star
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(175, 160);
          ctx.quadraticCurveTo(175, 175, 190, 175);
          ctx.quadraticCurveTo(175, 175, 175, 190);
          ctx.quadraticCurveTo(175, 175, 160, 175);
          ctx.quadraticCurveTo(175, 175, 175, 160);
          ctx.fill();
        } else if (selectedLogo === 'qr') {
          // Draw high-tech QR blocks representation
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(165, 165, 8, 8);
          ctx.fillRect(177, 165, 8, 8);
          ctx.fillRect(165, 177, 8, 8);
          ctx.fillRect(177, 177, 4, 4);
        }
      }
    };
  }, [isOpen, qrCodeDataUrl, selectedColor, selectedLogo]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `branded-qr-${shortCode}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSaveStyle) return;

    // Send hex and logo preferences to the parent
    onSaveStyle({
      qrColor: selectedColor,
      qrBrandLogo: selectedLogo,
      qrCodeDataUrl: canvas.toDataURL('image/png')
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white dark:bg-[#0c101d] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left panel: Preview canvas */}
          <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-r border-slate-100 dark:border-white/5 flex flex-col items-center justify-center gap-6">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Live Branded Preview
            </h4>
            
            <div className="p-4 rounded-2xl bg-white shadow-xl flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={350}
                height={350}
                className="w-56 h-56 object-contain"
              />
            </div>
            
            <p className="text-[10px] text-slate-400 text-center font-medium">
              High error-correction level ensures scanning<br />even with custom logo branding.
            </p>
          </div>

          {/* Right panel: Customizer controls */}
          <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-md font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    QR Brand Designer
                  </h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">Customize shortcode print parameters</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* 1. BRAND COLORS PICKER */}
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Color Palettes
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setSelectedColor(preset.hex)}
                      className="h-8 rounded-lg relative flex items-center justify-center transition-transform active:scale-95"
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {selectedColor === preset.hex && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
                {/* Custom Color Input */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="h-6 w-10 border border-slate-200 dark:border-white/10 rounded cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono text-slate-650 dark:text-slate-350">{selectedColor.toUpperCase()}</span>
                </div>
              </div>

              {/* 2. OVERLAY LOGO CHOICE */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Center Emblem Overlay
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LOGO_PRESETS.map((logo) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => setSelectedLogo(logo.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl text-left border transition-all flex items-center justify-between ${
                        selectedLogo === logo.id
                          ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300'
                      }`}
                    >
                      <span>{logo.label}</span>
                      {selectedLogo === logo.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-white/[0.04] flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save Brand Style
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QrCustomizer;
