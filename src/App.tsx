import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  FileDown, 
  Type, 
  History, 
  Sparkles,
  Download,
  Copy,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HandwritingCanvas } from './components/HandwritingCanvas';
import { performOCR } from './services/ocrService';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import confetti from 'canvas-confetti';
import Markdown from 'react-markdown';

interface OCRResult {
  id: string;
  text: string;
  timestamp: number;
  type: 'image' | 'pdf' | 'handwriting';
  fileName?: string;
}

export default function App() {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'draw'>('upload');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOCR = async (fileData: string, mimeType: string, type: 'image' | 'pdf' | 'handwriting', fileName?: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const text = await performOCR(fileData, mimeType, type === 'handwriting');
      const newResult: OCRResult = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        timestamp: Date.now(),
        type,
        fileName
      };
      setResults(prev => [newResult, ...prev]);
      setCurrentText(text);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399']
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during OCR processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const type = file.type.includes('pdf') ? 'pdf' : 'image';
        handleOCR(base64, file.type, type, file.name);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsTxt = () => {
    const blob = new Blob([currentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(currentText, 180);
    doc.text(splitText, 10, 10);
    doc.save(`extracted-text-${Date.now()}.pdf`);
  };

  const downloadAsPpt = () => {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();
    slide.addText(currentText, { x: 0.5, y: 0.5, w: '90%', h: '90%', fontSize: 14 });
    pptx.writeFile({ fileName: `extracted-text-${Date.now()}.pptx` });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary p-2 rounded-xl shadow-sm">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Handwritten <span className="text-brand-primary">OCR Pro</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium">Powered by Gemini AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'upload' ? 'bg-slate-50 text-brand-primary border-b-2 border-brand-primary' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload size={18} />
                  Upload Document
                </button>
                <button
                  onClick={() => setActiveTab('draw')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'draw' ? 'bg-slate-50 text-brand-primary border-b-2 border-brand-primary' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Type size={18} />
                  Draw Manually
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'upload' ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                      isDragActive ? 'border-brand-primary bg-emerald-50' : 'border-slate-200 hover:border-brand-primary hover:bg-slate-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <ImageIcon size={32} />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {isDragActive ? 'Drop files here' : 'Click or drag files to upload'}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Supports PNG, JPG, WEBP and PDF
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <HandwritingCanvas 
                    onCapture={(base64) => handleOCR(base64, 'image/png', 'handwriting')} 
                    isProcessing={isProcessing}
                  />
                )}
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Processing Error</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                    <X size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <History size={20} className="text-slate-400" />
                <h2 className="font-bold">Recent Extractions</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {results.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                    No history yet. Start by uploading or drawing!
                  </div>
                ) : (
                  results.map((res) => (
                    <motion.button
                      key={res.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setCurrentText(res.text)}
                      className={`flex items-center gap-4 p-4 bg-white border rounded-xl text-left transition-all hover:shadow-md ${
                        currentText === res.text ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        res.type === 'pdf' ? 'bg-red-50 text-red-600' : 
                        res.type === 'image' ? 'bg-blue-50 text-blue-600' : 
                        'bg-purple-50 text-purple-600'
                      }`}>
                        {res.type === 'pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {res.fileName || (res.type === 'handwriting' ? 'Handwritten Note' : 'Image Extraction')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(res.timestamp).toLocaleTimeString()} • {res.text.length} characters
                        </p>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[600px] sticky top-24">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Output</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!currentText}
                    className="p-2 text-slate-500 hover:text-brand-primary hover:bg-white rounded-lg transition-all disabled:opacity-30"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={18} className="text-brand-primary" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-auto bg-white">
                {isProcessing ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium animate-pulse">Analyzing document with AI...</p>
                  </div>
                ) : currentText ? (
                  <div className="markdown-body">
                    <Markdown>{currentText}</Markdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 text-center">
                    <FileText size={48} strokeWidth={1} />
                    <div>
                      <p className="font-semibold text-slate-600">No content extracted</p>
                      <p className="text-sm max-w-[200px]">Upload a file or draw on the canvas to see results here.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Export Options</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={downloadAsTxt}
                    disabled={!currentText}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Download size={18} className="text-slate-400 group-hover:text-brand-primary" />
                    <span className="text-xs font-bold">TXT</span>
                  </button>
                  <button
                    onClick={downloadAsPdf}
                    disabled={!currentText}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <FileDown size={18} className="text-slate-400 group-hover:text-brand-primary" />
                    <span className="text-xs font-bold">PDF</span>
                  </button>
                  <button
                    onClick={downloadAsPpt}
                    disabled={!currentText}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <FileText size={18} className="text-slate-400 group-hover:text-brand-primary" />
                    <span className="text-xs font-bold">PPT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            © 2026 Handwritten OCR Pro. Built with Gemini AI and React.
          </p>
        </div>
      </footer>
    </div>
  );
}
