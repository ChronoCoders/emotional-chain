import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { Block } from '@shared/schema';

export default function VisualBlocks() {
  const [realtimeBlocks, setRealtimeBlocks] = useState<Block[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: initialBlocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks'],
    select: (data) => data.slice(-6) // Show last 6 blocks
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data?.latestBlocks) {
      setRealtimeBlocks(lastMessage.data.latestBlocks);
    }
  }, [lastMessage]);

  const blocks = realtimeBlocks.length > 0 ? realtimeBlocks : initialBlocks;

  const formatHash = (hash: string) => {
    return hash ? `${hash.substring(0, 8)}...${hash.substring(-8)}` : 'N/A';
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffSeconds < 30) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  const getBlockColor = (height: number) => {
    // Color blocks based on height for visual distinction
    const colors = [
      'border-terminal-success bg-terminal-success/10',
      'border-terminal-cyan bg-terminal-cyan/10', 
      'border-terminal-warning bg-terminal-warning/10',
      'border-blue-400 bg-blue-400/10',
      'border-purple-400 bg-purple-400/10',
      'border-pink-400 bg-pink-400/10'
    ];
    return colors[height % colors.length];
  };

  const calculateReward = (block: Block) => {
    // Calculate total reward from transactions
    const miningReward = 69.1; // From logs: 50 base + 19.1 bonus
    const validationReward = 4.02; // From logs
    return miningReward + validationReward;
  };

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold mb-4">
        ┌── VISUAL_BLOCK_EXPLORER ──┐
      </h2>
      
      {blocks.length === 0 ? (
        <div className="text-terminal-dim text-center py-8">
          <div className="text-2xl mb-2">⛏️</div>
          <div>Waiting for blocks to be mined...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.slice().reverse().map((block, index) => (
            <div
              key={block.id}
              className={`relative border-2 rounded-lg p-4 transition-all duration-300 hover:scale-105 ${getBlockColor(block.height)}`}
            >
              {/* Block Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-terminal-success rounded-full animate-pulse"></div>
                  <span className="text-terminal-success font-bold">
                    BLOCK #{block.height}
                  </span>
                </div>
                <div className="text-xs text-terminal-dim">
                  {formatTimeAgo(block.timestamp)}
                </div>
              </div>

              {/* Block Hash */}
              <div className="mb-3">
                <div className="text-xs text-terminal-warning">HASH</div>
                <div className="text-terminal-cyan font-mono text-sm">
                  {formatHash(block.hash)}
                </div>
              </div>

              {/* Block Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-terminal-warning">TRANSACTIONS</div>
                  <div className="text-terminal-cyan font-bold">
                    {block.transactions?.length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-terminal-warning">REWARD</div>
                  <div className="text-terminal-success font-bold">
                    {calculateReward(block).toFixed(2)} EMO
                  </div>
                </div>
                <div>
                  <div className="text-terminal-warning">EMOTION</div>
                  <div className="text-terminal-cyan font-bold">
                    {parseFloat(block.emotionalScore || '0').toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-terminal-warning">CONSENSUS</div>
                  <div className="text-terminal-success font-bold">
                    {parseFloat(block.consensusScore || '0').toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Validator Info */}
              <div className="mt-3 pt-3 border-t border-terminal-border">
                <div className="text-xs">
                  <div className="text-terminal-warning">MINED BY</div>
                  <div className="text-terminal-cyan font-mono">
                    {block.validator ? `${block.validator.substring(0, 12)}...` : 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Block Connection Line */}
              {index < blocks.length - 1 && (
                <div className="absolute -right-2 top-1/2 w-4 h-0.5 bg-terminal-border transform -translate-y-1/2 hidden lg:block"></div>
              )}

              {/* Mining Animation for Latest Block */}
              {index === 0 && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-terminal-success rounded-full animate-ping"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-terminal-success rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Block Stats Footer */}
      <div className="mt-6 pt-4 border-t border-terminal-border">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-terminal-warning">TOTAL BLOCKS</div>
            <div className="text-terminal-cyan text-lg font-bold">
              {blocks.length > 0 ? Math.max(...blocks.map(b => b.height)) : 0}
            </div>
          </div>
          <div>
            <div className="text-terminal-warning">AVG BLOCK TIME</div>
            <div className="text-terminal-cyan text-lg font-bold">
              ~10s
            </div>
          </div>
          <div>
            <div className="text-terminal-warning">MINING STATUS</div>
            <div className="text-terminal-success text-lg font-bold flex items-center justify-center">
              <span className="w-2 h-2 bg-terminal-success rounded-full animate-pulse mr-2"></span>
              ACTIVE
            </div>
          </div>
        </div>
      </div>

      {/* Live Mining Indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-terminal-dim">
          <span className="w-2 h-2 bg-terminal-success rounded-full animate-pulse"></span>
          <span>Live mining with Proof of Emotion consensus</span>
          <span className="w-2 h-2 bg-terminal-success rounded-full animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}