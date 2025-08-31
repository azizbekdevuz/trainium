'use client';

import { useState } from 'react';

type Props = {
  userId: string;
  initialRole: 'ADMIN' | 'STAFF' | 'CUSTOMER';
};

export default function CustomerRoleEditor({ userId, initialRole }: Props) {
  const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'CUSTOMER'>(initialRole);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      setMessage('Role updated');
    } catch {
      setMessage('Failed to update role');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as any)}
        className="h-9 rounded-lg border px-3"
      >
        <option value="CUSTOMER">CUSTOMER</option>
        <option value="STAFF">STAFF</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button
        onClick={onSave}
        disabled={saving}
        className="h-9 px-4 rounded-lg bg-cyan-600 text-white text-sm disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {message && <span className="text-xs text-gray-600">{message}</span>}
    </div>
  );
}


