// src/app/admin/charities/CharityManager.tsx
'use client';
import { useState } from 'react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Check, X } from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  featured: boolean;
  active: boolean;
  _count: { selections: number };
}

interface Props { initialCharities: Charity[] }

const emptyForm = { name: '', description: '', imageUrl: '', websiteUrl: '', featured: false };

export default function CharityManager({ initialCharities }: Props) {
  const [charities, setCharities] = useState<Charity[]>(initialCharities);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  function startEdit(c: Charity) {
    setEditId(c.id);
    setForm({
      name:        c.name,
      description: c.description,
      imageUrl:    c.imageUrl ?? '',
      websiteUrl:  c.websiteUrl ?? '',
      featured:    c.featured,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');

    const url    = editId ? `/api/admin/charities/${editId}` : '/api/admin/charities';
    const method = editId ? 'PATCH' : 'POST';

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Failed'); return; }

    if (editId) {
      setCharities(prev => prev.map(c => c.id === editId ? { ...c, ...data.charity } : c));
    } else {
      setCharities(prev => [{ ...data.charity, _count: { selections: 0 } }, ...prev]);
    }
    resetForm();
  }

  async function toggleActive(charity: Charity) {
    const res  = await fetch(`/api/admin/charities/${charity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !charity.active }),
    });
    const data = await res.json();
    if (res.ok) {
      setCharities(prev => prev.map(c => c.id === charity.id ? { ...c, active: data.charity.active } : c));
    }
  }

  async function toggleFeatured(charity: Charity) {
    const res  = await fetch(`/api/admin/charities/${charity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !charity.featured }),
    });
    const data = await res.json();
    if (res.ok) {
      setCharities(prev => prev.map(c => c.id === charity.id ? { ...c, featured: data.charity.featured } : c));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Archive this charity? (soft delete)')) return;
    const res = await fetch(`/api/admin/charities/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCharities(prev => prev.map(c => c.id === id ? { ...c, active: false } : c));
    }
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} variant="secondary">
          <Plus className="w-4 h-4" /> Add Charity
        </Button>
      ) : (
        <Card className="p-6">
          <h3 className="font-display text-xl text-brand-cream mb-5">
            {editId ? 'Edit Charity' : 'New Charity'}
          </h3>
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Charity Name" id="name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-warm/80">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-cream placeholder:text-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all resize-none"
              />
            </div>
            <Input
              label="Image URL (optional)" id="imageUrl"
              value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
            <Input
              label="Website URL (optional)" id="websiteUrl"
              value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
              placeholder="https://..."
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                className="accent-amber-400"
              />
              <span className="text-sm text-brand-warm/80">Featured on homepage</span>
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={loading}>
                <Check className="w-4 h-4" /> {editId ? 'Save Changes' : 'Add Charity'}
              </Button>
              <Button variant="ghost" type="button" onClick={resetForm}>
                <X className="w-4 h-4" /> Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {charities.map(c => (
          <Card key={c.id} className={`p-5 ${!c.active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-brand-cream truncate">{c.name}</span>
                  {c.featured && <Badge variant="gold">Featured</Badge>}
                  {!c.active && <Badge variant="red">Archived</Badge>}
                </div>
                <p className="text-xs text-brand-muted line-clamp-2">{c.description}</p>
                <p className="text-xs text-brand-muted/60 mt-1">{c._count.selections} supporters</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleFeatured(c)}
                  title="Toggle featured"
                  className={`p-1.5 rounded-lg transition-colors ${c.featured ? 'text-brand-gold' : 'text-brand-muted hover:text-brand-gold'}`}
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  title="Toggle visibility"
                  className="p-1.5 rounded-lg text-brand-muted hover:text-brand-cream transition-colors"
                >
                  {c.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => startEdit(c)}
                  className="p-1.5 rounded-lg text-brand-muted hover:text-brand-cream transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
