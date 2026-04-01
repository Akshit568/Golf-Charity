// src/app/admin/draws/DrawControls.tsx
'use client';
import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { Play, Zap, CheckCircle } from 'lucide-react';

interface Props {
  drawId?: string;
  drawStatus?: string;
  currentMonth?: number;
  currentYear?: number;
}

interface SimPreview {
  numbers: number[];
  preview: { name: string; email: string; scores: number[]; matches: number; matchType: string }[];
}

export default function DrawControls({ drawId, drawStatus, currentMonth, currentYear }: Props) {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [simResult, setSimResult]   = useState<SimPreview | null>(null);

  // Create new draw
  const [showCreate, setShowCreate] = useState(false);
  const [month, setMonth]           = useState(currentMonth ?? new Date().getMonth() + 1);
  const [year, setYear]             = useState(currentYear ?? new Date().getFullYear());
  const [drawType, setDrawType]     = useState<'RANDOM' | 'ALGORITHMIC'>('RANDOM');

  async function handleCreate() {
    setLoading(true); setError(''); setSuccess('');
    const res = await fetch('/api/admin/draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year, drawType }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed'); return; }
    setSuccess('Draw created! Refresh to see it.');
    setShowCreate(false);
    window.location.reload();
  }

  async function handleAction(action: 'simulate' | 'publish') {
    if (!drawId) return;
    setLoading(true); setError(''); setSuccess(''); setSimResult(null);

    const res = await fetch(`/api/admin/draws/${drawId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Action failed'); return; }

    if (action === 'simulate') {
      setSimResult({ numbers: data.numbers, preview: data.preview });
    } else {
      setSuccess(`Draw published! ${data.winners?.length ?? 0} winner(s) recorded.`);
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  // If this is the "create draw" panel (no drawId)
  if (!drawId) {
    return (
      <div className="mb-6">
        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)} variant="secondary">
            <Play className="w-4 h-4" /> Create New Draw
          </Button>
        ) : (
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h3 className="font-display text-xl text-brand-cream">New Draw</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-brand-muted mb-1 block">Month</label>
                <select
                  value={month}
                  onChange={e => setMonth(+e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1 block">Year</label>
                <input
                  type="number" value={year} min={2024} max={2100}
                  onChange={e => setYear(+e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1 block">Draw Type</label>
                <select
                  value={drawType}
                  onChange={e => setDrawType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none"
                >
                  <option value="RANDOM">Random</option>
                  <option value="ALGORITHMIC">Algorithmic</option>
                </select>
              </div>
            </div>
            {error   && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}
            <div className="flex gap-2">
              <Button loading={loading} onClick={handleCreate}>Create Draw</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Draw action panel (simulate / publish)
  return (
    <div className="mt-5 space-y-3">
      {error   && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
      {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">{success}</p>}

      <div className="flex gap-2 flex-wrap">
        {drawStatus !== 'PUBLISHED' && (
          <Button variant="secondary" size="sm" loading={loading} onClick={() => handleAction('simulate')}>
            <Zap className="w-3.5 h-3.5" /> Simulate Draw
          </Button>
        )}
        {drawStatus === 'SIMULATED' && (
          <Button size="sm" loading={loading} onClick={() => handleAction('publish')}>
            <CheckCircle className="w-3.5 h-3.5" /> Publish Results
          </Button>
        )}
      </div>

      {simResult && (
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/8">
          <p className="text-xs font-mono text-brand-muted uppercase tracking-wider mb-3">Simulation Preview</p>
          <div className="flex gap-2 mb-4">
            {simResult.numbers.map(n => (
              <span key={n} className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30 flex items-center justify-center text-xs font-mono font-bold">
                {n}
              </span>
            ))}
          </div>
          {simResult.preview.length === 0 ? (
            <p className="text-sm text-brand-muted">No winners in this simulation</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-brand-cream font-medium">{simResult.preview.length} winner(s):</p>
              {simResult.preview.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-brand-cream">{w.name}</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-brand-muted text-xs">{w.matches} match</span>
                    <Badge variant="gold">{w.matchType?.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
