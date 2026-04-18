import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Check, X, Hash } from 'lucide-react';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

export default function StoryCard({ story }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const { updateStory } = useStore();

  const handleEdit = () => {
    setEditData({
      title: story.title,
      userStory: story.userStory,
      storyPoints: story.storyPoints,
      priority: story.priority,
    });
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = async () => {
    try {
      await updateStory(story._id, editData);
      setEditing(false);
      toast.success('Story updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-mono text-primary-400 bg-primary-600/10 px-2 py-1 rounded-md shrink-0">
            {story.storyId}
          </span>
          {editing ? (
            <input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="flex-1 bg-surface-800 border border-primary-500/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h4 className="font-medium text-white truncate">{story.title}</h4>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`badge badge-${story.priority}`}>{story.priority}</span>
          <span className="flex items-center gap-1 text-xs text-surface-400 bg-surface-800/50 px-2 py-1 rounded-lg">
            <Hash size={12} />
            {story.storyPoints}
          </span>
          {!editing && (
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(); }}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-primary-400 transition-colors"
            >
              <Edit3 size={14} />
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-surface-500" /> : <ChevronDown size={16} className="text-surface-500" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          {/* User Story */}
          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">User Story</p>
            {editing ? (
              <textarea
                value={editData.userStory}
                onChange={(e) => setEditData({ ...editData, userStory: e.target.value })}
                className="w-full bg-surface-800 border border-primary-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none"
                rows={3}
              />
            ) : (
              <p className="text-surface-200 text-sm italic">"{story.userStory}"</p>
            )}
          </div>

          {/* Acceptance Criteria */}
          {story.acceptanceCriteria?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">
                Acceptance Criteria
              </p>
              <div className="space-y-2">
                {story.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="bg-surface-900/50 rounded-lg p-3 text-sm">
                    <p><span className="text-success-400 font-medium">Given</span> <span className="text-surface-200">{ac.given}</span></p>
                    <p><span className="text-warning-400 font-medium">When</span> <span className="text-surface-200">{ac.when}</span></p>
                    <p><span className="text-accent-400 font-medium">Then</span> <span className="text-surface-200">{ac.then}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edge Cases */}
          {story.edgeCases?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Edge Cases</p>
              <ul className="space-y-1">
                {story.edgeCases.map((ec, i) => (
                  <li key={i} className="text-sm text-surface-300 flex items-start gap-2">
                    <span className="text-warning-400 mt-1">⚡</span> {ec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {story.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {story.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-surface-800 text-surface-400 border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Edit actions */}
          {editing && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-surface-400">Points:</label>
                <select
                  value={editData.storyPoints}
                  onChange={(e) => setEditData({ ...editData, storyPoints: Number(e.target.value) })}
                  className="bg-surface-800 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                >
                  {[1, 2, 3, 5, 8, 13, 21].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-surface-400">Priority:</label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="bg-surface-800 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                >
                  {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1" />
              <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
                <X size={16} />
              </button>
              <button onClick={handleSave} className="btn-glow !py-2 !px-4 text-sm flex items-center gap-1.5">
                <Check size={14} /> Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
