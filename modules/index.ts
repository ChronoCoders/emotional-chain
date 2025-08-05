/**
 * EmotionalChain Modules Exports
 */

export { WalletModule } from './WalletModule';
export { MiningModule } from './MiningModule';

export type { 
  WalletBalance, 
  TransactionHistory 
} from './WalletModule';

export type { 
  MiningSession, 
  MiningReward 
} from './MiningModule';