import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import StoryList from '../components/stories/StoryList';
import QualityPanel from '../components/quality/QualityPanel';
import DependencyGraphView from '../components/graph/DependencyGraph';
import { exportApi } from '../api/client';
import { Layers, ShieldAlert, GitBranch, Download, ArrowLeft, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'stories', label: 'User Stories', icon: Layers },
  { id: 'quality', label: 'Quality Issues', icon: ShieldAlert },
  { id: 'dependencies', label: 'Dependencies', icon: GitBranch },
];

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentPrd, activeTab, setActiveTab,
    groupedStories, storyStats, qualityIssues, qualitySummary, dependencyGraph,
    storiesLoading, analysisLoading,
    fetchStories, fetchAnalysis, pollStatus,
  } = useStore();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    pollStatus(id);
    fetchStories(id);
    fetchAnalysis(id);
  }, [id, pollStatus, fetchStories, fetchAnalysis]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === 'jira') {
        const res = await exportApi.export(id, format);
        toast.success(`${res.data.message}`);
      } else {
        const res = await exportApi.export(id, format);
        const blob = new Blob([res], { type: format === 'csv' ? 'text/csv' : 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stories-${id}.${format === 'csv' ? 'csv' : 'md'}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{currentPrd?.title || 'Results'}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-surface-400">
              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                {currentPrd?.fileType?.toUpperCase()}
              </span>
              <span>•</span>
              <span>{storyStats?.total || 0} stories</span>
              <span>•</span>
              <span>{storyStats?.totalPoints || 0} total points</span>
              <span>•</span>
              <span>{qualityIssues?.length || 0} quality issues</span>
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors border border-white/5"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => handleExport('markdown')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors border border-white/5"
          >
            <Download size={14} /> MD
          </button>
          <button
            onClick={() => handleExport('jira')}
            disabled={exporting}
            className="btn-glow !py-2 !px-3 text-sm flex items-center gap-1.5"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Jira
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-surface-900/60 p-1 border border-white/5">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === tabId
                ? 'bg-primary-600/20 text-primary-300 shadow-md border border-primary-500/20'
                : 'text-surface-400 hover:text-surface-200'}`}
          >
            <Icon size={16} />
            {label}
            {tabId === 'quality' && qualityIssues?.length > 0 && (
              <span className="ml-1 text-xs bg-warning-500/20 text-warning-400 px-1.5 py-0.5 rounded-full">
                {qualityIssues.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'stories' && (
          storiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="glass-card p-5">
                  <div className="skeleton h-5 w-64 mb-2" />
                  <div className="skeleton h-4 w-48" />
                </div>
              ))}
            </div>
          ) : (
            <StoryList groupedStories={groupedStories} stats={storyStats} />
          )
        )}

        {activeTab === 'quality' && (
          analysisLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-5">
                  <div className="skeleton h-5 w-48 mb-2" />
                  <div className="skeleton h-4 w-80" />
                </div>
              ))}
            </div>
          ) : (
            <QualityPanel issues={qualityIssues} summary={qualitySummary} />
          )
        )}

        {activeTab === 'dependencies' && (
          <DependencyGraphView graph={dependencyGraph} />
        )}
      </div>
    </div>
  );
}
