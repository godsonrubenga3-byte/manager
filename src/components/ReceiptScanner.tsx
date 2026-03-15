import React, { useState } from 'react';
import { Camera as CameraIcon, X, RefreshCw, Check } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { scanReceipt } from '../services/geminiService';

interface ReceiptScannerProps {
  onScan: (data: any) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScan, onClose }: ReceiptScannerProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.message !== "User cancelled photos app") {
        setError("Could not access camera. Please ensure you have granted permission.");
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

        <div className="relative aspect-[3/4] bg-black flex flex-col items-center justify-center">
          {!capturedImage ? (
            <div className="flex flex-col items-center gap-6 p-12">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-pulse">
                <CameraIcon className="w-12 h-12" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Receipt Scanner</h3>
                <p className="text-stone-400 text-sm px-4">Tap below to capture a clear photo of your receipt. Our AI will automatically extract the details.</p>
              </div>
              <button 
                onClick={takePhoto}
                className="px-8 py-4 bg-primary hover:bg-secondary text-white font-bold rounded-2xl shadow-xl shadow-primary/25 transition-all flex items-center gap-3"
              >
                <CameraIcon className="w-6 h-6" />
                Open Camera
              </button>
            </div>
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured receipt" 
              className="w-full h-full object-contain bg-stone-900"
            />
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="font-bold tracking-widest uppercase text-sm">Analyzing Receipt with AI...</p>
            </div>
          )}
        </div>

        {capturedImage && (
          <div className="p-6 bg-card-dark border-t border-border-dark">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                {error}
              </div>
            )}

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
          </div>
        )}
      </div>
    </div>
  );
}
