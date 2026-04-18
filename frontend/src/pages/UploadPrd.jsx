import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import useStore from '../store/useStore';
import { Upload, FileText, Type, ArrowRight, Loader2, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadPrd() {
  const [mode, setMode] = useState('upload'); // 'upload' | 'paste'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { uploadPrd, uploadPrdText, startProcessing } = useStore();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let prd;

      if (mode === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);
        prd = await uploadPrd(formData);
      } else if (mode === 'paste' && content.trim().length >= 50) {
        prd = await uploadPrdText(content, title || undefined);
      } else {
        toast.error(mode === 'upload' ? 'Please select a file' : 'Content must be at least 50 characters');
        setLoading(false);
        return;
      }

      await startProcessing(prd.id);
      toast.success('PRD uploaded! Processing started.');
      navigate(`/processing/${prd.id}`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-500/20 flex items-center justify-center border border-primary-500/20">
          <Sparkles size={28} className="text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">Upload PRD</h1>
        <p className="text-surface-400 mt-2 max-w-md mx-auto">
          Upload a document or paste your requirements. Our AI will decompose it into structured Agile artifacts.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex rounded-xl bg-surface-900/60 p-1 border border-white/5">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all
            ${mode === 'upload' ? 'bg-primary-600/20 text-primary-300 shadow-md' : 'text-surface-400 hover:text-surface-200'}`}
        >
          <Upload size={16} /> Upload File
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all
            ${mode === 'paste' ? 'bg-primary-600/20 text-primary-300 shadow-md' : 'text-surface-400 hover:text-surface-200'}`}
        >
          <Type size={16} /> Paste Content
        </button>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-surface-300 mb-2">
          Title <span className="text-surface-600">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., E-Commerce Platform PRD v2.0"
          className="w-full px-4 py-3 rounded-xl bg-surface-900/60 border border-white/10 text-white placeholder-surface-600 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
      </div>

      {/* Upload Zone */}
      {mode === 'upload' ? (
        <div>
          {file ? (
            <div className="glass-card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600/15 flex items-center justify-center">
                  <FileText size={22} className="text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-sm text-surface-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 rounded-lg hover:bg-danger-500/15 text-surface-500 hover:text-danger-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`glass-card p-12 text-center cursor-pointer transition-all border-2 border-dashed
                ${isDragActive
                  ? 'border-primary-500 bg-primary-600/10'
                  : 'border-surface-700 hover:border-primary-500/40'}`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800/50 flex items-center justify-center">
                <Upload size={28} className="text-surface-400" />
              </div>
              <p className="text-white font-medium mb-1">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your PRD file'}
              </p>
              <p className="text-sm text-surface-500">or click to browse • PDF, DOCX, MD supported</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">PRD Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your Product Requirements Document here...&#10;&#10;Include features, user flows, requirements, acceptance criteria, etc."
            rows={16}
            className="w-full px-4 py-3 rounded-xl bg-surface-900/60 border border-white/10 text-white placeholder-surface-600 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all resize-y font-mono text-sm leading-relaxed"
          />
          <p className="text-sm text-surface-500 mt-2">
            {content.length} characters • Minimum 50 required
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || (mode === 'upload' && !file) || (mode === 'paste' && content.length < 50)}
        className="btn-glow w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:transform-none"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Analyze with AI
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
}
