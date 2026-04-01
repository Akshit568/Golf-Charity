// src/app/admin/winners/WinnerActions.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { Check, X } from 'lucide-react';

export default function WinnerActions({ winnerId }: { winnerId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState('');

  async function updateStatus(status: 'PAID' | 'REJECTED') {
    setLoading(true);
    const res = await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId, paymentStatus: status }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(status);
      setTimeout(() => window.location.reload(), 800);
    }
  }

  if (done) {
    return (
      <span className={`text-sm font-mono ${done === 'PAID' ? 'text-green-400' : 'text-red-400'}`}>
        Marked as {done}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        loading={loading}
        onClick={() => updateStatus('PAID')}
        className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
      >
        <Check className="w-3.5 h-3.5" /> Approve & Pay
      </Button>
      <Button
        size="sm"
        variant="danger"
        loading={loading}
        onClick={() => updateStatus('REJECTED')}
      >
        <X className="w-3.5 h-3.5" /> Reject
      </Button>
    </div>
  );
}
