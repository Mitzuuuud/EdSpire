'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';

export function WalletSync({ walletAddress }: { walletAddress: string }) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      // Get Firebase ID token for authenticated user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const idToken = await user.getIdToken();

      // Call secure server-side API
      const response = await fetch('/api/blockchain/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sync failed');
      }

      const result = await response.json();
      // Update UI with new balance
      console.log('Sync successful:', result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync Wallet'}
    </button>
  );
}
