// src/app/dashboard/ScoreManager.tsx
'use client';
import { useState } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

interface Score {
  id: string;
  score: number;
  datePlayed: string | Date;
}

interface Props {
  initialScores: Score[];
}

export default function ScoreManager({ initialScores }: Props) {
  const [scores, setScores]   = useState<Score[]>(initialScores);
  const [adding, setAdding]   = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [newScore, setNewScore]     = useState('');
  const [newDate,  setNewDate]      = useState(new Date().toISOString().split('T')[0]);
  const [editScore, setEditScore]   = useState('');
  const [editDate,  setEditDate]    = useState('');

  async function handleAdd() {
    if (!newScore || !newDate) return;
    const s = parseInt(newScore);
    if (s < 1 || s > 45) { setError('Score must be 1–45'); return; }

    setLoading(true);
    setError('');
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: s, datePlayed: new Date(newDate).toISOString() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to add score'); return; }

    // Refresh local state with rolling 5
    setScores(prev => {
      const updated = [data.score, ...prev].slice(0, 5);
      return updated;
    });
    setNewScore('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setAdding(false);
  }

  async function handleUpdate(id: string) {
    const s = parseInt(editScore);
    if (s < 1 || s > 45) { setError('Score must be 1–45'); return; }

    setLoading(true);
    setError('');
    const res = await fetch(`/api/scores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: s, datePlayed: new Date(editDate).toISOString() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to update'); return; }

    setScores(prev => prev.map(sc => sc.id === id ? data.score : sc));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await fetch(`/api/scores/${id}`, { method: 'DELETE' });
    setScores(prev => prev.filter(sc => sc.id !== id));
    setLoading(false);
  }

  function startEdit(s: Score) {
    setEditId(s.id);
    setEditScore(s.score.toString());
    setEditDate(new Date(s.datePlayed).toISOString().split('T')[0]);
  }

  const scoreColor = (s: number) => {
    if (s >= 35) return 'bg-brand-gold text-brand-dark';
    if (s >= 25) return 'bg-brand-green/60 text-green-100';
    if (s >= 15) return 'bg-white/10 text-brand-cream';
    return 'bg-white/5 text-brand-muted';
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-mono text-brand-muted">
          {scores.length}/5 scores · {5 - scores.length > 0 ? `${5 - scores.length} slots open` : 'Full — adding replaces oldest'}
        </p>
        {!adding && scores.length < 5 && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Score
          </Button>
        )}
        {!adding && scores.length >= 5 && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" /> Add (Replaces Oldest)
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <Card className="p-4">
          <p className="text-xs font-mono text-brand-muted uppercase tracking-wider mb-3">New Score</p>
          <div className="flex gap-3">
            <input
              type="number" min={1} max={45}
              placeholder="Score (1–45)"
              value={newScore}
              onChange={e => setNewScore(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" loading={loading} onClick={handleAdd}>
              <Check className="w-3.5 h-3.5" /> Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setError(''); }}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Score list */}
      {scores.length === 0 && !adding && (
        <Card className="p-8 text-center">
          <p className="text-brand-muted text-sm mb-1">No scores yet</p>
          <p className="text-xs text-brand-muted/60">Add your last 5 Stableford scores to enter monthly draws</p>
        </Card>
      )}

      {scores.map((sc, i) => (
        <Card key={sc.id} className="p-4">
          {editId === sc.id ? (
            <div>
              <div className="flex gap-3 mb-3">
                <input
                  type="number" min={1} max={45}
                  value={editScore}
                  onChange={e => setEditScore(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                />
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-cream text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={loading} onClick={() => handleUpdate(sc.id)}>
                  <Check className="w-3.5 h-3.5" /> Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${scoreColor(sc.score)}`}>
                  {sc.score}
                </div>
                <div>
                  <div className="text-sm text-brand-cream font-medium">Stableford: {sc.score} pts</div>
                  <div className="text-xs text-brand-muted">
                    {new Date(sc.datePlayed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {i === 0 && (
                  <Badge variant="green">Latest</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(sc)} className="p-1.5 rounded-lg hover:bg-white/5 text-brand-muted hover:text-brand-cream transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(sc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
