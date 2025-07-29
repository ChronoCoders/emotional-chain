import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { Block, Transaction } from '@shared/schema';

export default function BlockchainExplorer() {
  const [realtimeBlocks, setRealtimeBlocks] = useState<Block[]>([]);
  const [realtimeTransactions, setRealtimeTransactions] = useState<Transaction[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: initialBlocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks'],
    select: (data) => data.slice(0, 3)
  });

  const { data: initialTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    select: (data) => data.slice(0, 5)
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

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold mb-4">
        ┌── LIVE_BLOCKCHAIN_EXPLORER ──┐
      </h2>
      
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
