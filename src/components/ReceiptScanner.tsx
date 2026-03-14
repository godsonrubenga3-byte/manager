import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import { scanReceipt } from '../services/geminiService';

interface ReceiptScannerProps {
  onScan: (data: any) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScan, onClose }: ReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please ensure you have granted permission.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleScan = async () => {
    if (!capturedImage) return;
    setIsScanning(true);
    setError(null);
    try {
      const data = await scanReceipt(capturedImage);
      onScan(data);
    } catch (err) {
      setError("Failed to analyze receipt. Please try again with a clearer photo.");
    } finally {
      setIsScanning(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card-dark rounded-3xl overflow-hidden border border-border-dark shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative aspect-[3/4] bg-black flex items-center justify-center">
          {!capturedImage ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {isCameraReady && (
                <button 
                  onClick={captureImage}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-primary/50 flex items-center justify-center shadow-xl active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-2 border-stone-200" />
                </button>
              )}
            </>
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured receipt" 
              className="w-full h-full object-contain"
            />
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
              <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="font-bold tracking-widest uppercase text-sm">Analyzing Receipt...</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-card-dark border-t border-border-dark">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          {!capturedImage ? (
            <div className="text-center">
              <p className="text-stone-400 text-sm">Position the receipt within the frame and tap the button to capture.</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={retake}
                disabled={isScanning}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-stone-300 font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Retake
              </button>
              <button 
                onClick={handleScan}
                disabled={isScanning}
                className="flex-1 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
