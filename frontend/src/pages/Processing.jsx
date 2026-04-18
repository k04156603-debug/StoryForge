import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import usePolling from '../hooks/usePolling';
import { Loader2, CheckCircle2, AlertTriangle, Brain, Code2, Search, GitBranch } from 'lucide-react';

const stages = [
  { key: 'extracting', label: 'Extracting Features', icon: Search, color: 'primary' },
  { key: 'generating', label: 'Generating Stories', icon: Code2, color: 'accent' },
  { key: 'analyzing', label: 'Quality Analysis', icon: Brain, color: 'warning' },
  { key: 'dependencies', label: 'Mapping Dependencies', icon: GitBranch, color: 'success' },
];

export default function Processing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { processingStatus, pollStatus } = useStore();

  const poll = useCallback(async () => {
    const prd = await pollStatus(id);
    return prd;
  }, [id, pollStatus]);

  usePolling(
    poll,
    2000,
    true,
    (prd) => {
      if (prd.status === 'completed') {
        navigate(`/results/${id}`, { replace: true });
        return true;
      }
      if (prd.status === 'failed') return true;
      return false;
    }
  );

  const progress = processingStatus?.progress || 0;
  const message = processingStatus?.message || 'Initializing...';
  const status = processingStatus?.status || 'extracting';

  const getCurrentStageIndex = () => {
    if (progress < 25) return 0;
    if (progress < 55) return 1;
    if (progress < 75) return 2;
    return 3;
  };
  const currentStage = getCurrentStageIndex();

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger-500/15 flex items-center justify-center">
            <AlertTriangle size={36} className="text-danger-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing Failed</h2>
          <p className="text-surface-400 mb-6">{message}</p>
          <button onClick={() => navigate('/upload')} className="btn-glow">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-lg w-full space-y-8">
        {/* Animated orb */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 animate-pulse" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary-600/20 to-accent-600/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-6 rounded-full bg-surface-900 flex items-center justify-center">
              <Brain size={36} className="text-primary-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-surface-300">{message}</span>
            <span className="text-sm font-bold text-primary-400">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="glass-card p-6 space-y-4">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const isActive = i === currentStage;
            const isDone = i < currentStage;
            const isPending = i > currentStage;

            return (
              <div
                key={stage.key}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500
                  ${isActive ? 'bg-primary-600/10 border border-primary-500/20' : ''}
                  ${isDone ? 'opacity-60' : ''}
                  ${isPending ? 'opacity-30' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
                  ${isDone ? 'bg-success-500/20' : isActive ? 'bg-primary-600/20' : 'bg-surface-800'}`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-success-400" />
                  ) : isActive ? (
                    <Loader2 size={18} className="text-primary-400 animate-spin" />
                  ) : (
                    <Icon size={18} className="text-surface-500" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-surface-400'}`}>
                    {stage.label}
                  </p>
                  {isDone && <p className="text-xs text-success-400">Complete</p>}
                  {isActive && <p className="text-xs text-primary-400">In progress...</p>}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-surface-500">
          This may take 1-5 minutes depending on PRD size
        </p>
      </div>
    </div>
  );
}
