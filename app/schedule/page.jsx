'use client';

import { useState, useEffect } from 'react';

const REPO_OWNER = 'GanlandNFT';
const REPO_NAME = 'gan-schedule';
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`;

// Filter out any issues that might contain sensitive info
const HIDDEN_KEYWORDS = ['secret', 'password', 'key', 'token', 'private', 'credential'];

function sanitizeIssue(issue) {
  // Check if issue contains sensitive keywords
  const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
  for (const keyword of HIDDEN_KEYWORDS) {
    if (text.includes(keyword)) {
      return null;
    }
  }
  return issue;
}

export default function SchedulePage() {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadIssues = async () => {
    setLoading(true);
    setError(null);

    try {
      const [openRes, closedRes] = await Promise.all([
        fetch(`${API_URL}?state=open&per_page=100`),
        fetch(`${API_URL}?state=closed&per_page=50`)
      ]);

      if (!openRes.ok || !closedRes.ok) {
        throw new Error('Failed to fetch issues');
      }

      const openIssues = await openRes.json();
      const closedIssues = await closedRes.json();
      const allIssues = [...openIssues, ...closedIssues];

      const categorized = { todo: [], inprogress: [], done: [] };

      allIssues.forEach(issue => {
        // Filter out sensitive issues
        const sanitized = sanitizeIssue(issue);
        if (!sanitized) return;

        const labels = issue.labels.map(l => l.name.toLowerCase());

        if (issue.state === 'closed' || labels.includes('done')) {
          categorized.done.push(issue);
        } else if (labels.includes('in-progress') || labels.includes('inprogress') || labels.includes('progress')) {
          categorized.inprogress.push(issue);
        } else {
          categorized.todo.push(issue);
        }
      });

      // Sort by number (most recent first)
      Object.keys(categorized).forEach(key => {
        categorized[key].sort((a, b) => b.number - a.number);
      });

      setTasks(categorized);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    const interval = setInterval(loadIssues, 120000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  const truncate = (str, len) => {
    if (!str) return '';
    str = str.replace(/\r?\n/g, ' ').trim();
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString();
  };

  const totalTasks = tasks.todo.length + tasks.inprogress.length + tasks.done.length;
  const completionRate = totalTasks > 0 ? Math.round((tasks.done.length / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gan-yellow">GAN</span> Schedule
        </h1>
        <p className="text-gray-400">
          Development progress for the Fractal Visions AI Agent
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="To Do" value={tasks.todo.length} color="text-gray-400" />
        <StatCard label="In Progress" value={tasks.inprogress.length} color="text-yellow-400" />
        <StatCard label="Completed" value={tasks.done.length} color="text-green-400" />
        <StatCard label="Completion" value={`${completionRate}%`} color="text-purple-400" />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`}
          target="_blank"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          📋 All Issues
        </a>
        <button
          onClick={loadIssues}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          🔄 Refresh
        </button>
        {lastUpdated && (
          <span className="px-4 py-2 text-gray-500 text-sm">
            Updated {timeAgo(lastUpdated)}
          </span>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-8">
          Failed to load issues: {error}
        </div>
      )}

      {/* Board */}
      <div className="grid md:grid-cols-3 gap-6">
        <Column
          title="To Do"
          emoji="📋"
          issues={tasks.todo}
          loading={loading}
          bgColor="bg-gray-800/30"
          borderColor="border-gray-700"
        />
        <Column
          title="In Progress"
          emoji="⚡"
          issues={tasks.inprogress}
          loading={loading}
          bgColor="bg-yellow-500/5"
          borderColor="border-yellow-500/30"
        />
        <Column
          title="Done"
          emoji="✅"
          issues={tasks.done}
          loading={loading}
          bgColor="bg-green-500/5"
          borderColor="border-green-500/30"
        />
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>
          Powered by{' '}
          <a href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`} target="_blank" className="text-gan-yellow hover:underline">
            GitHub Issues
          </a>
        </p>
        <p className="mt-2 italic">patterns emerge from noise. signal found. 👁️</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function Column({ title, emoji, issues, loading, bgColor, borderColor }) {
  const truncate = (str, len) => {
    if (!str) return '';
    str = str.replace(/\r?\n/g, ' ').trim();
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString();
  };

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="font-medium">
          {emoji} {title}
        </span>
        <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-400">
          {issues.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-gan-yellow rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No tasks</div>
        ) : (
          issues.map(issue => (
            <a
              key={issue.id}
              href={issue.html_url}
              target="_blank"
              className="block p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div className="font-medium text-sm mb-1 text-white hover:text-gan-yellow">
                {issue.title}
              </div>
              {issue.body && (
                <div className="text-gray-500 text-xs mb-2">
                  {truncate(issue.body, 80)}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>#{issue.number}</span>
                <span>{timeAgo(issue.created_at)}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
