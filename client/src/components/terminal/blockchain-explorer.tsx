import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { Block, Transaction } from '@shared/schema';

interface WalletInfo {
  validatorId: string;
  balance: number;
  currency: string;
}

interface WalletStatus {
  address: string;
  balance: string;  
  staked: string;
  type: string;
  validatorId: string;
  authScore: string;
  stressThreshold: string;
  validationCount: number;
  reputation: string;
}

export default function BlockchainExplorer() {
  const [realtimeBlocks, setRealtimeBlocks] = useState<Block[]>([]);
  const [realtimeTransactions, setRealtimeTransactions] = useState<Transaction[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<string>('StellarNode');
  const [transferForm, setTransferForm] = useState<{ from: string; to: string; amount: string }>({ from: '', to: '', amount: '' });
  const [transferStatus, setTransferStatus] = useState<{ success: boolean; message: string } | null>(null);
  const { lastMessage } = useWebSocket();

  const { data: initialBlocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks'],
    select: (data) => data.slice(0, 3)
  });

  const { data: initialTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    select: (data) => data.slice(0, 5)
  });

  const { data: wallets = [] } = useQuery<WalletInfo[]>({
    queryKey: ['/api/wallets']
  });

  const { data: walletStatus } = useQuery<WalletStatus>({
    queryKey: ['/api/wallet/status', selectedValidator],
    queryFn: async () => {
      const response = await fetch(`/api/wallet/status/${selectedValidator}`);
      if (!response.ok) throw new Error('Failed to fetch wallet status');
      return response.json();
    }
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data) {
      if (lastMessage.data.latestBlocks) {
        setRealtimeBlocks(lastMessage.data.latestBlocks);
      }
      if (lastMessage.data.latestTransactions) {
        setRealtimeTransactions(lastMessage.data.latestTransactions);
      }
    }
  }, [lastMessage]);

  const blocks = realtimeBlocks.length > 0 ? realtimeBlocks : initialBlocks;
  const transactions = realtimeTransactions.length > 0 ? realtimeTransactions : initialTransactions;

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} min ago`;
  };

  const formatHash = (hash: string) => {
    return hash ? hash.substring(0, 12) + '...' : 'N/A';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-terminal-success';
      case 'pending': return 'text-terminal-warning';
      case 'failed': return 'text-terminal-error';
      default: return 'text-terminal-warning';
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.from || !transferForm.to || !transferForm.amount || parseFloat(transferForm.amount) <= 0) {
      return;
    }

    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: transferForm.from,
          to: transferForm.to,
          amount: parseFloat(transferForm.amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setTransferStatus({ success: true, message: data.message });
        setTransferForm({ from: '', to: '', amount: '' });
        // Refresh wallet data
        queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/status', transferForm.from] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/status', transferForm.to] });
      } else {
        setTransferStatus({ success: false, message: data.message || 'Transfer failed' });
      }
    } catch (error) {
      setTransferStatus({ success: false, message: 'Transfer failed - network error' });
    }

    // Clear status after 5 seconds
    setTimeout(() => setTransferStatus(null), 5000);
  };

  const handleSyncWallet = async () => {
    try {
      await fetch('/api/wallet/sync', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/status'] });
      setTransferStatus({ success: true, message: 'Wallets synced successfully' });
      setTimeout(() => setTransferStatus(null), 3000);
    } catch (error) {
      setTransferStatus({ success: false, message: 'Sync failed' });
      setTimeout(() => setTransferStatus(null), 3000);
    }
  };

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold mb-4">
        ┌── LIVE_BLOCKCHAIN_EXPLORER ──┐
      </h2>
      
      {/* EmotionalWallet Interface */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3">🧠 EmotionalWallet Interface:</h3>
        <div className="bg-terminal-surface p-4 rounded border border-terminal-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wallet Status */}
            <div className="space-y-3">
              <h4 className="text-terminal-cyan font-semibold">💰 Wallet Status</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-terminal-green">Validator:</span>
                  <select 
                    value={selectedValidator}
                    onChange={(e) => setSelectedValidator(e.target.value)}
                    className="bg-terminal-background text-terminal-green border border-terminal-border rounded px-2 py-1"
                  >
                    {wallets.slice(0, 10).map((wallet) => (
                      <option key={wallet.validatorId} value={wallet.validatorId}>
                        {wallet.validatorId}
                      </option>
                    ))}
                  </select>
                </div>
                {walletStatus && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Address:</span>
                      <span className="text-terminal-cyan font-mono text-xs">{walletStatus.address.substring(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Balance:</span>
                      <span className="text-terminal-warning font-bold">{walletStatus.balance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Staked:</span>
                      <span className="text-terminal-cyan">{walletStatus.staked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Type:</span>
                      <span className="text-terminal-orange">{walletStatus.type}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Emotional Profile */}
            <div className="space-y-3">
              <h4 className="text-terminal-cyan font-semibold">🧠 Emotional Profile</h4>
              <div className="text-sm space-y-1">
                {walletStatus && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Auth Score:</span>
                      <span className="text-terminal-success">{walletStatus.authScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Stress Threshold:</span>
                      <span className="text-terminal-warning">{walletStatus.stressThreshold}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Validations:</span>
                      <span className="text-terminal-cyan">{walletStatus.validationCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-terminal-green">Reputation:</span>
                      <span className="text-terminal-success">{walletStatus.reputation}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Interface */}
          <div className="mt-4 pt-4 border-t border-terminal-border">
            <h4 className="text-terminal-cyan font-semibold mb-2">💸 Transfer EMO Tokens</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-terminal-green block mb-1">From:</label>
                <select 
                  value={transferForm.from}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full bg-terminal-background text-terminal-green border border-terminal-border rounded px-2 py-1"
                >
                  <option value="">Select sender...</option>
                  {wallets.filter(w => w.balance > 0).map((wallet) => (
                    <option key={wallet.validatorId} value={wallet.validatorId}>
                      {wallet.validatorId} ({wallet.balance.toFixed(2)} EMO)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-terminal-green block mb-1">To:</label>
                <select 
                  value={transferForm.to}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full bg-terminal-background text-terminal-green border border-terminal-border rounded px-2 py-1"
                >
                  <option value="">Select recipient...</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.validatorId} value={wallet.validatorId}>
                      {wallet.validatorId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-terminal-green block mb-1">Amount (EMO):</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-terminal-background text-terminal-green border border-terminal-border rounded px-2 py-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={handleTransfer}
                disabled={!transferForm.from || !transferForm.to || !transferForm.amount || parseFloat(transferForm.amount) <= 0}
                className="bg-terminal-cyan text-terminal-background px-4 py-2 rounded hover:bg-terminal-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send EMO
              </button>
              <button 
                onClick={handleSyncWallet}
                className="bg-terminal-green text-terminal-background px-4 py-2 rounded hover:bg-terminal-cyan transition-colors"
              >
                Sync Wallets
              </button>
            </div>
            {transferStatus && (
              <div className={`mt-2 p-2 rounded text-sm ${transferStatus.success ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                {transferStatus.message}
              </div>
            )}
          </div>

          {/* Top Wallets by Balance */}
          <div className="mt-4 pt-4 border-t border-terminal-border">
            <h4 className="text-terminal-cyan font-semibold mb-2">💎 Top Wallet Balances</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {wallets
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 6)
                .map((wallet) => (
                  <div key={wallet.validatorId} className="flex justify-between bg-terminal-background p-2 rounded">
                    <span className="text-terminal-green">{wallet.validatorId.substring(0, 8)}...</span>
                    <span className="text-terminal-warning font-bold">{wallet.balance.toFixed(2)} EMO</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Latest Blocks */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3">📦 Latest Blocks:</h3>
        <div className="space-y-2">
          {blocks.map((block) => (
            <div key={block.id} className="bg-terminal-surface p-3 rounded border border-terminal-border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-terminal-cyan font-bold">Block #{block.height}</div>
                  <div className="text-terminal-green text-sm">Hash: {formatHash(block.hash)}</div>
                  <div className="text-terminal-green text-sm">Transactions: {block.transactions.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-terminal-orange text-sm">{formatTimeAgo(block.timestamp)}</div>
                  <div className="text-terminal-success text-sm">✅ Validated</div>
                  <div className="text-terminal-cyan text-sm">PoE Score: {block.emotionalScore}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div>
        <h3 className="text-terminal-orange mb-3">💸 Recent Transactions:</h3>
        <div className="overflow-x-auto">
          <table className="w-full terminal-table text-sm">
            <thead>
              <tr className="text-terminal-cyan">
                <th className="text-left">TxID</th>
                <th className="text-left">From</th>
                <th className="text-left">To</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody className="text-terminal-green">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="terminal-text">{formatHash(tx.hash)}</td>
                  <td className="terminal-text">{formatHash(tx.from)}</td>
                  <td className="terminal-text">{formatHash(tx.to)}</td>
                  <td className="text-right">{tx.amount} EMO</td>
                  <td>
                    <span className={getStatusColor(tx.status)}>
                      {getStatusIcon(tx.status)} {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
