'use client';

import { useState, useEffect } from 'react';

const REPO_OWNER = 'GanlandNFT';
const REPO_NAME = 'gan-schedule';
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`;

export default function SchedulePage() {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [openRes, closedRes] = await Promise.all([
        fetch(`${API_URL}?state=open&per_page=100`),
        fetch(`${API_URL}?state=closed&per_page=30`)
      ]);

      if (!openRes.ok || !closedRes.ok) throw new Error('Failed to fetch');

      const openIssues = await openRes.json();
      const closedIssues = await closedRes.json();
      const allIssues = [...openIssues, ...closedIssues];

      const categorized = { todo: [], inprogress: [], done: [] };

      allIssues.forEach(issue => {
        const labels = issue.labels.map(l => l.name.toLowerCase());
        
        if (issue.state === 'closed' || labels.includes('done')) {
          categorized.done.push(issue);
        } else if (labels.includes('in-progress') || labels.includes('inprogress')) {
          categorized.inprogress.push(issue);
        } else {
          categorized.todo.push(issue);
        }
      });

      setTasks(categorized);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    const interval = setInterval(loadIssues, 120000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString();
  };

  const Column = ({ status, title, emoji, color, issues }) => (
    <div className="flex-1 min-w-[280px]">
      <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-gray-800`}>
        <span className="text-lg">{emoji}</span>
        <span className="font-semibold">{title}</span>
        <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${color}`}>
          {issues.length}
        </span>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">Failed to load</div>
        ) : issues.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No tasks</div>
        ) : (
          issues.map(issue => (
            <a
              key={issue.id}
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
            >
              <div className="font-medium text-sm mb-1 text-white hover:text-gan-yellow transition-colors">
                {issue.title}
              </div>
              {issue.body && (
                <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {issue.body.slice(0, 100)}
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-600">
                <span>#{issue.number}</span>
                <span>{timeAgo(issue.created_at)}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-gan-yellow">GAN</span> Schedule
        </h1>
        <p className="text-gray-400">Development roadmap powered by GitHub Issues</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
        <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-gray-400">{tasks.todo.length}</div>
          <div className="text-xs text-gray-500">To Do</div>
        </div>
        <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-blue-400">{tasks.inprogress.length}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-2xl font-bold text-green-400">{tasks.done.length}</div>
          <div className="text-xs text-gray-500">Done</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mb-8">
        <button 
          onClick={loadIssues}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
        >
          🔄 Refresh
        </button>
        <a
          href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
        >
          📋 View on GitHub
        </a>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Column 
          status="todo" 
          title="To Do" 
          emoji="📋" 
          color="bg-gray-700 text-gray-300"
          issues={tasks.todo} 
        />
        <Column 
          status="inprogress" 
          title="In Progress" 
          emoji="⚡" 
          color="bg-blue-500/20 text-blue-400"
          issues={tasks.inprogress} 
        />
        <Column 
          status="done" 
          title="Completed" 
          emoji="✅" 
          color="bg-green-500/20 text-green-400"
          issues={tasks.done} 
        />
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          <em>patterns emerge from noise. signal found.</em> 👁️
        </p>
      </div>
    </div>
  );
}
