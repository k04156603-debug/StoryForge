import { useState } from 'react';
import useStore from '../../store/useStore';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const severityConfig = {
  blocker: { icon: AlertTriangle, color: 'danger', bg: 'bg-danger-500/10', border: 'border-danger-500/30' },
  warning: { icon: AlertCircle, color: 'warning', bg: 'bg-warning-500/10', border: 'border-warning-500/30' },
  suggestion: { icon: Info, color: 'accent', bg: 'bg-accent-500/10', border: 'border-accent-500/30' },
};

export default function QualityPanel({ issues, summary }) {
  const [filter, setFilter] = useState('all');
  const { resolveIssue } = useStore();

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);

  const handleResolve = async (id) => {
    await resolveIssue(id);
    toast.success('Issue marked as resolved');
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-500/15 flex items-center justify-center">
              <AlertTriangle size={18} className="text-danger-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.bySeverity?.blocker || 0}</p>
              <p className="text-xs text-surface-400">Blockers</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-500/15 flex items-center justify-center">
              <AlertCircle size={18} className="text-warning-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.bySeverity?.warning || 0}</p>
              <p className="text-xs text-surface-400">Warnings</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500/15 flex items-center justify-center">
              <Info size={18} className="text-accent-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.bySeverity?.suggestion || 0}</p>
              <p className="text-xs text-surface-400">Suggestions</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-surface-500" />
        {['all', 'blocker', 'warning', 'suggestion'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize
              ${filter === f
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Issues list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-success-400 mb-3" />
            <p className="text-surface-300">No issues found in this category</p>
          </div>
        ) : (
          filtered.map((issue) => {
            const config = severityConfig[issue.severity] || severityConfig.suggestion;
            const Icon = config.icon;

            return (
              <div
                key={issue._id}
                className={`glass-card p-4 border-l-4 ${config.border} ${issue.resolved ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={16} className={`text-${config.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white text-sm">{issue.title}</h4>
                      <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
                      <span className="text-xs text-surface-500 bg-surface-800 px-2 py-0.5 rounded">
                        {issue.issueType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-surface-300 mb-2">{issue.description}</p>

                    {issue.originalText && (
                      <div className="bg-surface-900/50 rounded-lg p-3 mb-2 border-l-2 border-surface-700">
                        <p className="text-xs text-surface-500 mb-1">Original text:</p>
                        <p className="text-sm text-surface-400 italic">"{issue.originalText}"</p>
                      </div>
                    )}

                    {issue.suggestedFix && (
                      <div className="bg-success-500/5 rounded-lg p-3 border border-success-500/20">
                        <p className="text-xs text-success-400 mb-1">💡 Suggested fix:</p>
                        <p className="text-sm text-surface-200">{issue.suggestedFix}</p>
                      </div>
                    )}
                  </div>

                  {!issue.resolved && (
                    <button
                      onClick={() => handleResolve(issue._id)}
                      className="p-2 rounded-lg hover:bg-success-500/15 text-surface-500 hover:text-success-400 transition-colors shrink-0"
                      title="Mark as resolved"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
