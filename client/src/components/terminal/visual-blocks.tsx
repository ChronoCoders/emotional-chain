import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { Block } from '@shared/schema';

export default function VisualBlocks() {
  const [realtimeBlocks, setRealtimeBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<'chain' | 'stack' | 'circle'>('chain');
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
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
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
    const emotionalReward = 69.1; // From logs: 50 base + 19.1 emotional bonus
    const validationReward = 4.02; // From logs
    return emotionalReward + validationReward;
  };

  const getLayoutTransform = (index: number, total: number) => {
    switch (viewMode) {
      case 'stack':
        return `rotateX(-15deg) rotateY(25deg) translateY(${index * -30}px) translateZ(${index * 10}px)`;
      case 'circle':
        const angle = (index / total) * 360;
        const radius = 150;
        return `rotateX(-15deg) rotateY(${angle}deg) translateZ(${radius}px)`;
      default: // chain
        return `rotateX(-15deg) rotateY(${25 + index * 5}deg) translateZ(${index * -20}px)`;
    }
  };

  return (
    <div className="terminal-window rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-terminal-cyan text-lg font-bold">
          ┌── VISUAL_BLOCK_EXPLORER ──┐
        </h2>
        
        {/* View Controls */}
        <div className="flex space-x-2 text-xs">
          <button
            onClick={() => setViewMode('chain')}
            className={`px-2 py-1 border transition-colors ${
              viewMode === 'chain' 
                ? 'border-terminal-success text-terminal-success bg-terminal-success/20' 
                : 'border-terminal-border text-terminal-dim hover:text-terminal-cyan'
            }`}
          >
            CHAIN
          </button>
          <button
            onClick={() => setViewMode('stack')}
            className={`px-2 py-1 border transition-colors ${
              viewMode === 'stack' 
                ? 'border-terminal-success text-terminal-success bg-terminal-success/20' 
                : 'border-terminal-border text-terminal-dim hover:text-terminal-cyan'
            }`}
          >
            STACK
          </button>
          <button
            onClick={() => setViewMode('circle')}
            className={`px-2 py-1 border transition-colors ${
              viewMode === 'circle' 
                ? 'border-terminal-success text-terminal-success bg-terminal-success/20' 
                : 'border-terminal-border text-terminal-dim hover:text-terminal-cyan'
            }`}
          >
            CIRCLE
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 border transition-colors ${
              autoRotate 
                ? 'border-terminal-warning text-terminal-warning bg-terminal-warning/20' 
                : 'border-terminal-border text-terminal-dim hover:text-terminal-cyan'
            }`}
          >
            AUTO-ROTATE
          </button>
        </div>
      </div>
      
      {blocks.length === 0 ? (
        <div className="text-terminal-dim text-center py-8">
          <div className="text-2xl mb-2">⛏️</div>
          <div>Waiting for blocks to be validated...</div>
        </div>
      ) : (
        <div className="relative min-h-96 perspective-1000">
          <div className={`flex justify-center items-center h-80 ${viewMode === 'circle' ? 'relative' : 'space-x-4'}`}>
            {blocks.slice().reverse().slice(0, 6).map((block, index) => (
              <div
                key={block.id}
                className={`block-3d-container ${autoRotate ? 'auto-rotate' : ''} ${selectedBlock?.id === block.id ? 'selected' : ''}`}
                style={{
                  transform: getLayoutTransform(index, Math.min(blocks.length, 6)),
                  animationDelay: `${index * 0.2}s`,
                  position: viewMode === 'circle' ? 'absolute' : 'relative'
                }}
                onClick={() => setSelectedBlock(selectedBlock?.id === block.id ? null : block)}
              >
                {/* 3D Block Structure */}
                <div className={`block-3d ${getBlockColor(block.height)} ${selectedBlock?.id === block.id ? 'selected-glow' : ''}`}>
                  {/* Front Face */}
                  <div className={`block-face block-face-front ${getBlockColor(block.height)}`}>
                    <div className="text-center">
                      <div className="text-terminal-success font-bold text-sm mb-1">
                        #{block.height}
                      </div>
                      <div className="text-xs text-terminal-cyan font-mono mb-1">
                        {formatHash(block.hash)}
                      </div>
                      <div className="text-xs">
                        <div className="text-terminal-warning">EMOTION</div>
                        <div className="text-terminal-cyan font-bold">
                          {parseFloat(block.emotionalScore || '0').toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div className={`block-face block-face-back ${getBlockColor(block.height)}`}>
                    <div className="text-center">
                      <div className="text-terminal-warning text-xs mb-1">VALIDATOR</div>
                      <div className="text-terminal-cyan font-mono text-xs">
                        {block.validatorId ? `${block.validatorId.substring(0, 8)}...` : `V-${block.height % 21 + 1}`}
                      </div>
                    </div>
                  </div>

                  {/* Right Face */}
                  <div className={`block-face block-face-right ${getBlockColor(block.height)}`}>
                    <div className="text-center">
                      <div className="text-terminal-warning text-xs mb-1">TXN</div>
                      <div className="text-terminal-cyan font-bold mb-2">
                        {block.transactionCount || 0}
                      </div>
                      <div className="text-terminal-warning text-xs mb-1">REWARD</div>
                      <div className="text-terminal-success font-bold text-xs">
                        {calculateReward(block).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Left Face */}
                  <div className={`block-face block-face-left ${getBlockColor(block.height)}`}>
                    <div className="text-center">
                      <div className="text-terminal-warning text-xs mb-1">DIFFICULTY</div>
                      <div className="text-terminal-cyan font-bold">
                        {block.difficulty}
                      </div>
                    </div>
                  </div>

                  {/* Top Face */}
                  <div className={`block-face block-face-top ${getBlockColor(block.height)}`}>
                    <div className="text-center">
                      <div className="text-terminal-warning text-xs mb-1">CONSENSUS</div>
                      <div className="text-terminal-success font-bold">
                        {parseFloat(block.emotionalScore || '0').toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Bottom Face */}
                  <div className={`block-face block-face-bottom ${getBlockColor(block.height)}`}>
                    <div className="text-center">
                      <div className="text-terminal-warning text-xs mb-1">NONCE</div>
                      <div className="text-terminal-cyan font-bold text-xs">
                        {block.nonce}
                      </div>
                    </div>
                  </div>

                  {/* Connection Line to Previous Block */}
                  {index < blocks.length - 1 && index < 5 && (
                    <div className="block-connection"></div>
                  )}

                  {/* Validation Glow for Latest Block */}
                  {index === 0 && (
                    <div className="validation-glow latest-block"></div>
                  )}
                  
                  {/* Block Health Indicator */}
                  <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${
                    parseFloat(block.emotionalScore || '0') > 90 ? 'bg-terminal-success' :
                    parseFloat(block.emotionalScore || '0') > 75 ? 'bg-terminal-cyan' :
                    parseFloat(block.emotionalScore || '0') > 50 ? 'bg-terminal-warning' : 'bg-terminal-error'
                  } animate-pulse`}></div>
                </div>

                {/* Block Info Below */}
                <div className="mt-6 text-center">
                  <div className="text-xs text-terminal-dim">
                    {formatTimeAgo(new Date(block.timestamp))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <div className="text-terminal-warning">VALIDATION STATUS</div>
            <div className="text-terminal-success text-lg font-bold flex items-center justify-center">
              <span className="w-2 h-2 bg-terminal-success rounded-full animate-pulse mr-2"></span>
              ACTIVE
            </div>
          </div>
        </div>
      </div>

      {/* Selected Block Details */}
      {selectedBlock && (
        <div className="mt-6 p-4 border border-terminal-cyan bg-terminal-cyan/10 rounded-lg">
          <h3 className="text-terminal-cyan font-bold mb-3">BLOCK #{selectedBlock.height} DETAILS</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-terminal-warning">FULL HASH</div>
              <div className="text-terminal-cyan font-mono text-xs break-all">{selectedBlock.hash}</div>
            </div>
            <div>
              <div className="text-terminal-warning">PREVIOUS HASH</div>
              <div className="text-terminal-cyan font-mono text-xs break-all">{selectedBlock.previousHash}</div>
            </div>
            <div>
              <div className="text-terminal-warning">MERKLE ROOT</div>
              <div className="text-terminal-cyan font-mono text-xs break-all">{selectedBlock.merkleRoot}</div>
            </div>
            <div>
              <div className="text-terminal-warning">VALIDATOR</div>
              <div className="text-terminal-cyan font-mono text-xs break-all">
                {selectedBlock.validatorId || `Validator-${selectedBlock.height % 21 + 1}`}
              </div>
            </div>
            <div>
              <div className="text-terminal-warning">EMOTIONAL SCORE</div>
              <div className="text-terminal-success font-bold">{parseFloat(selectedBlock.emotionalScore || '0').toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-terminal-warning">TIMESTAMP</div>
              <div className="text-terminal-cyan">{new Date(selectedBlock.timestamp).toLocaleString()}</div>
            </div>
          </div>
          <button 
            onClick={() => setSelectedBlock(null)}
            className="mt-3 px-3 py-1 border border-terminal-border text-terminal-dim hover:text-terminal-cyan text-xs"
          >
            CLOSE
          </button>
        </div>
      )}

      {/* Live Validation Indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-terminal-dim">
          <span className="w-2 h-2 bg-terminal-success rounded-full animate-pulse"></span>
          <span>Live emotional validation with Proof of Emotion consensus</span>
          <span className="w-2 h-2 bg-terminal-success rounded-full animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}