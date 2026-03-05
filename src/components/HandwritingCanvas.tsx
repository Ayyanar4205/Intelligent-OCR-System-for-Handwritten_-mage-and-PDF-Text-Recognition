import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, Trash2, CheckCircle2 } from 'lucide-react';

interface HandwritingCanvasProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ onCapture, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 400;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onCapture(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white p-3 rounded-t-xl border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setColor('#000000')}
            className={`p-2 rounded-lg transition-colors ${color === '#000000' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            title="Pen"
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setColor('#ffffff')}
            className={`p-2 rounded-lg transition-colors ${color === '#ffffff' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24 accent-brand-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Clear
          </button>
          <button
            onClick={handleCapture}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Recognize
          </button>
        </div>
      </div>
      <div className="relative bg-white rounded-b-xl shadow-inner border border-slate-200 overflow-hidden canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full touch-none"
        />
      </div>
    </div>
  );
};
