/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Share2, 
  RefreshCcw, 
  QrCode, 
  Palette, 
  Type, 
  Maximize, 
  Check, 
  Image as ImageIcon,
  Upload,
  X,
  Wifi,
  WifiOff,
  Smartphone,
  Github
} from 'lucide-react';

const DEFAULT_BG = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2000';

export default function App() {
  const [text, setText] = useState('https://ais.studio');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(512); // Medium by default
  const [includeMargin, setIncludeMargin] = useState(true);
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [copied, setCopied] = useState(false);
  const [bgImage, setBgImage] = useState<string>(DEFAULT_BG);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [downloadQuality, setDownloadQuality] = useState<'Low' | 'Medium' | 'High'>('Medium');
  
  const qualitySizes = {
    Low: 256,
    Medium: 512,
    High: 1024
  };

  useEffect(() => {
    setSize(qualitySizes[downloadQuality]);
  }, [downloadQuality]);

  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const shareQR = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
      if (!blob) return;

      const file = new File([blob], "qrcode.png", { type: "image/png" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My QR Code',
          text: 'Check out this QR code I generated!',
        });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      {/* Background Image Layer */}
      <AnimatePresence>
        {bgImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={bgImage} 
              alt="Custom background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 flex flex-col items-center"
        >
          {/* Status Bar */}
          <div className="flex items-center gap-4 mb-8 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-500" />
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            {deferredPrompt && (
              <>
                <div className="h-3 w-px bg-zinc-300"></div>
                <button 
                  onClick={installApp}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-none bg-transparent hover:text-indigo-800 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Pakua App
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              QR <span className="gradient-text">Pro</span>
            </h1>
          </div>
          <p className="max-w-xl mx-auto text-lg text-zinc-600 font-medium">
            Tengeneza QR code za kisasa na uweke background uipendayo.
          </p>
        </motion.div>

        <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Input Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-8 space-y-8"
          >
            {/* Content Input */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <Type className="w-4 h-4 text-indigo-500" />
                Maelezo au Link (URL)
              </label>
              <textarea
                id="qr-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Andika hapa (mf. https://google.com)"
                className="w-full h-32 p-4 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-hidden transition-all resize-none shadow-sm placeholder:text-zinc-400"
              />
            </div>

            {/* Background Control Section */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                App Background
              </label>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-zinc-200 rounded-2xl hover:border-indigo-400 text-zinc-600 hover:text-indigo-600 transition-all cursor-pointer group"
                >
                  <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Weka Picha yako</span>
                </button>
                
                {bgImage !== DEFAULT_BG && (
                  <button
                    onClick={() => setBgImage(DEFAULT_BG)}
                    className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-bold text-sm shadow-sm"
                  >
                    <X className="w-5 h-5" />
                    Ondoa Picha
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            {/* Customization Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  Rangi ya QR
                </label>
                <div className="flex items-center gap-3 p-2 bg-white border border-zinc-200 rounded-xl">
                  <input
                    id="fg-color"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-sm font-mono text-zinc-500 uppercase">{fgColor}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Palette className="w-4 h-4 text-zinc-400 border rounded-xs" />
                  Rangi ya Background
                </label>
                <div className="flex items-center gap-3 p-2 bg-white border border-zinc-200 rounded-xl">
                  <input
                    id="bg-color"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-sm font-mono text-zinc-500 uppercase">{bgColor}</span>
                </div>
              </div>
            </div>

            {/* Advanced Switches */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-100">
               <button 
                onClick={() => setIncludeMargin(!includeMargin)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  includeMargin 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-white border-zinc-200 text-zinc-500'
                }`}
              >
                Weka Margin
              </button>
              <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-full border border-zinc-200">
                {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      level === lvl 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
                <span className="px-2 text-[10px] font-bold text-zinc-400 border-l border-zinc-200 ml-1">QUALITY</span>
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center space-y-8"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <div 
                ref={qrRef}
                className="relative p-10 bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${text}-${fgColor}-${bgColor}-${includeMargin}-${level}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <QRCodeCanvas
                      value={text || ' '}
                      size={size}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level={level}
                      includeMargin={includeMargin}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ubora wa Picha (Download Quality)</span>
                <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                  {(['Low', 'Medium', 'High'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setDownloadQuality(q)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        downloadQuality === q 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-zinc-500 hover:text-indigo-500'
                      }`}
                    >
                      {q} {q === 'High' && '✨'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button
                  onClick={downloadQR}
                  id="download-btn"
                  className="flex-1 w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-200"
                >
                  <Download className="w-5 h-5" />
                  Pakua ({qualitySizes[downloadQuality]}px)
                </button>
                <button
                  onClick={shareQR}
                  id="share-btn"
                  className="flex-1 w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 active:scale-95 transition-all shadow-lg"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
                  {copied ? 'Link Imenakiliwa!' : 'Share Siku Hizi'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-zinc-500 font-medium">
              <div className="flex items-center gap-1.5 cursor-help group" title="Ukubwa wa QR">
                <Maximize className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
                <span className="text-xs">{size}px</span>
              </div>
              <div className="h-4 w-px bg-zinc-300"></div>
              <button 
                onClick={() => {
                  setText('https://ais.studio');
                  setFgColor('#000000');
                  setBgColor('#ffffff');
                }}
                className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors group"
              >
                <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-xs">Reset</span>
              </button>
            </div>
          </motion.div>
        </main>

        <footer className="mt-20 text-zinc-500 flex flex-col items-center gap-4">
          <p className="text-sm font-medium">Made with ❤️ for modern sharing</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-900 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
