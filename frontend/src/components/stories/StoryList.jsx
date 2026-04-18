import { useState } from 'react';
import StoryCard from './StoryCard';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';

export default function StoryList({ groupedStories, stats }) {
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (featureId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  if (!groupedStories || groupedStories.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Layers size={32} className="mx-auto text-surface-500 mb-3" />
        <p className="text-surface-400">No stories generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-6 text-sm">
          <span className="text-surface-300">
            <span className="text-white font-semibold">{stats.total}</span> stories
          </span>
          <span className="text-surface-300">
            <span className="text-white font-semibold">{stats.totalPoints}</span> total points
          </span>
          <span className="text-surface-300">
            avg <span className="text-white font-semibold">{stats.avgPoints}</span> pts
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="badge badge-critical">{stats.byPriority?.critical || 0} critical</span>
            <span className="badge badge-high">{stats.byPriority?.high || 0} high</span>
            <span className="badge badge-medium">{stats.byPriority?.medium || 0} medium</span>
            <span className="badge badge-low">{stats.byPriority?.low || 0} low</span>
          </div>
        </div>
      )}

      {/* Feature groups */}
      {groupedStories.map((group) => {
        const collapsed = collapsedGroups[group.feature.id];
        return (
          <div key={group.feature.id} className="space-y-2">
            {/* Feature header */}
            <button
              onClick={() => toggleGroup(group.feature.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-900/40 hover:bg-surface-900/60 border border-white/5 transition-colors text-left"
            >
              {collapsed ? (
                <ChevronRight size={16} className="text-surface-500" />
              ) : (
                <ChevronDown size={16} className="text-surface-500" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-white">{group.feature.name}</h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  {group.stories.length} stories • {group.feature.category}
                </p>
              </div>
              <span className={`badge badge-${group.feature.priority}`}>{group.feature.priority}</span>
            </button>

            {/* Stories */}
            {!collapsed && (
              <div className="space-y-2 ml-4">
                {group.stories.map((story) => (
                  <StoryCard key={story._id} story={story} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
