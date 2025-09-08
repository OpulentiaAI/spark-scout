'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState('');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('token') || '';
    const u = sp.get('user') || '';
    setToken(t);
    setUser(u);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Reset failed');
      setOk(true);
    } catch (e: any) {
      setError(e?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <div className="text-sm text-muted-foreground">
        Password updated. You can now sign in.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 w-full">
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      {error && <div className="text-sm text-red-500">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading || !token || !user}>
        {loading ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}

