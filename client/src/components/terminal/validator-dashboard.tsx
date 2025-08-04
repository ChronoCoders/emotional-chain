import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { Validator } from '@shared/schema';

export default function ValidatorDashboard() {
  const [realtimeValidators, setRealtimeValidators] = useState<Validator[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: initialValidators = [] } = useQuery<Validator[]>({
    queryKey: ['/api/validators']
  });

  // Fetch real wallet balances for all validators
  const { data: walletBalances = [] } = useQuery<Array<{ validatorId: string; balance: number; currency: string }>>({
    queryKey: ['/api/wallets'],
    staleTime: 30000,
    refetchInterval: 30000
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data?.validators) {
      setRealtimeValidators(lastMessage.data.validators);
    }
  }, [lastMessage]);

  const validators = realtimeValidators.length > 0 ? realtimeValidators : initialValidators;

  const getValidatorStatus = (validator: Validator) => {
    const uptime = parseFloat(validator.uptime);
    const authScore = parseFloat(validator.authScore);
    
    if (!validator.isActive) return 'offline';
    if (uptime < 90 || authScore < 90) return 'warning';
    return 'online';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'warning': return 'status-warning';
      case 'offline': return 'status-offline';
      default: return 'status-offline';
    }
  };

  const formatEmoEarned = (emoEarned: string) => {
    const num = parseFloat(emoEarned);
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Get real wallet balance for a validator
  const getValidatorBalance = (validatorId: string): number => {
    const wallet = walletBalances.find(w => w.validatorId === validatorId);
    return wallet ? wallet.balance : 0;
  };

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold mb-4">
        ┌────── ACTIVE_VALIDATORS ──────┐
      </h2>
      
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-terminal">
        {validators.map((validator, index) => (
          <div key={validator.id} className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-terminal-cyan font-bold text-sm">
                {validator.id}
              </div>
              <span className={`status-indicator ${getStatusColor(getValidatorStatus(validator))}`}></span>
            </div>
            <div className="text-terminal-green text-xs space-y-1">
              <div>EMO Earned: {getValidatorBalance(validator.id).toLocaleString('en-US')} EMO</div>
              <div>Uptime: {parseFloat(validator.uptime).toFixed(1)}%</div>
              <div>Auth Score: {parseFloat(validator.authScore).toFixed(1)}%</div>
              <div>Device: {validator.device || 'Unknown Device'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
