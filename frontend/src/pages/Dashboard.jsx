import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { FileText, Plus, Trash2, Clock, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Sparkles, BookOpen, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { prds, prdLoading, fetchPrds, deletePrd } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrds();
  }, [fetchPrds]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this PRD and all its generated artifacts?')) {
      await deletePrd(id);
      toast.success('PRD deleted');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-success-400" />;
      case 'failed': return <AlertTriangle size={16} className="text-danger-400" />;
      case 'uploaded': return <Clock size={16} className="text-surface-400" />;
      default: return <Loader2 size={16} className="text-primary-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-success-500/15 text-success-400 border-success-500/30',
      failed: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
      uploaded: 'bg-surface-700/50 text-surface-400 border-surface-700',
    };
    return styles[status] || 'bg-primary-500/15 text-primary-400 border-primary-500/30';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Story Forge</h1>
          <p className="text-surface-400 mt-1">AI-powered PRD to Agile story converter</p>
        </div>
        <Link to="/upload" className="btn-glow flex items-center gap-2">
          <Plus size={18} />
          New PRD
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
            <BookOpen size={22} className="text-primary-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{prds.length}</p>
            <p className="text-sm text-surface-400">Total PRDs</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center">
            <CheckCircle2 size={22} className="text-success-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{prds.filter(p => p.status === 'completed').length}</p>
            <p className="text-sm text-surface-400">Processed</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
            <BarChart3 size={22} className="text-accent-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {prds.reduce((sum, p) => sum + (p.metadata?.storyCount || 0), 0)}
            </p>
            <p className="text-sm text-surface-400">Stories Generated</p>
          </div>
        </div>
      </div>

      {/* PRDs List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Your PRDs</h2>

        {prdLoading && prds.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5">
                <div className="skeleton h-5 w-48 mb-3" />
                <div className="skeleton h-4 w-32" />
              </div>
            ))}
          </div>
        ) : prds.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-600/10 flex items-center justify-center">
              <Sparkles size={36} className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No PRDs yet</h3>
            <p className="text-surface-400 mb-6 max-w-md mx-auto">
              Upload a Product Requirements Document to get started. We'll break it down into structured user stories, identify quality issues, and map dependencies.
            </p>
            <Link to="/upload" className="btn-glow inline-flex items-center gap-2">
              <Plus size={18} />
              Upload your first PRD
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {prds.map((prd) => (
              <div
                key={prd._id}
                onClick={() => {
                  if (prd.status === 'completed') navigate(`/results/${prd._id}`);
                  else if (['extracting', 'generating', 'analyzing', 'parsing'].includes(prd.status))
                    navigate(`/processing/${prd._id}`);
                }}
                className="glass-card p-5 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center">
                      <FileText size={18} className="text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">
                        {prd.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-surface-400">
                        <span>{prd.fileType?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{(prd.charCount / 1000).toFixed(1)}k chars</span>
                        <span>•</span>
                        <span>{new Date(prd.createdAt).toLocaleDateString()}</span>
                        {prd.metadata?.storyCount && (
                          <>
                            <span>•</span>
                            <span>{prd.metadata.storyCount} stories</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`badge border ${getStatusBadge(prd.status)} flex items-center gap-1.5`}>
                      {getStatusIcon(prd.status)}
                      {prd.status}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, prd._id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-danger-500/15 text-surface-500 hover:text-danger-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ArrowRight size={18} className="text-surface-600 group-hover:text-primary-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
