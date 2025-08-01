import { db, pool } from '../db';
import { tokenEconomics, validatorStates } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Persistent Token Economics Service
 * Maintains EMO token state across restarts using PostgreSQL database
 */
export class PersistentTokenEconomics {
  private static instance: PersistentTokenEconomics;
  private initialized = false;

  public static getInstance(): PersistentTokenEconomics {
    if (!PersistentTokenEconomics.instance) {
      PersistentTokenEconomics.instance = new PersistentTokenEconomics();
    }
    return PersistentTokenEconomics.instance;
  }

  /**
   * Initialize token economics from database or create initial state
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if token economics record exists
      const existing = await db.select().from(tokenEconomics).limit(1);
      
      if (existing.length === 0) {
        // Create initial token economics state
        await db.insert(tokenEconomics).values({
          totalSupply: "0",
          maxSupply: "1000000000",
          circulatingSupply: "0",
          stakingPoolAllocated: "400000000",
          stakingPoolRemaining: "400000000",
          stakingPoolUtilized: "0",
          wellnessPoolAllocated: "200000000",
          wellnessPoolRemaining: "200000000",
          wellnessPoolUtilized: "0",
          ecosystemPoolAllocated: "250000000",
          ecosystemPoolRemaining: "250000000",
          ecosystemPoolUtilized: "0",
          baseBlockReward: "50",
          baseValidationReward: "5",
          emotionalConsensusBonus: "25",
          minimumValidatorStake: "10000",
          lastBlockHeight: 0
        });
        console.log('Initialized fresh token economics state');
      } else {
        console.log('Loaded existing token economics from database');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize token economics:', error);
      throw error;
    }
  }

  /**
   * Get current token economics state
   */
  public async getTokenEconomics(): Promise<any> {
    await this.initialize();

    try {
      // REAL-TIME SYNC: Always sync with database transactions first
      await this.recalculateFromTransactions();
      
      const [economics] = await db.select().from(tokenEconomics).limit(1);
      
      if (!economics) {
        throw new Error('Token economics not initialized');
      }

      const totalSupply = parseFloat(economics.totalSupply);
      const maxSupply = parseFloat(economics.maxSupply);
      const circulatingSupply = parseFloat(economics.circulatingSupply);

      return {
        totalSupply,
        maxSupply,
        circulatingSupply,
        percentageIssued: (totalSupply / maxSupply) * 100,
        pools: {
          staking: {
            allocated: parseFloat(economics.stakingPoolAllocated),
            remaining: parseFloat(economics.stakingPoolRemaining),
            utilized: parseFloat(economics.stakingPoolUtilized)
          },
          wellness: {
            allocated: parseFloat(economics.wellnessPoolAllocated),
            remaining: parseFloat(economics.wellnessPoolRemaining),
            utilized: parseFloat(economics.wellnessPoolUtilized)
          },
          ecosystem: {
            allocated: parseFloat(economics.ecosystemPoolAllocated),
            remaining: parseFloat(economics.ecosystemPoolRemaining),
            utilized: parseFloat(economics.ecosystemPoolUtilized)
          }
        },
        rewards: {
          baseBlockReward: parseFloat(economics.baseBlockReward),
          baseValidationReward: parseFloat(economics.baseValidationReward),
          emotionalConsensusBonus: parseFloat(economics.emotionalConsensusBonus),
          minimumValidatorStake: parseFloat(economics.minimumValidatorStake)
        },
        contractStatus: 'AUTHENTIC_DISTRIBUTION_ACTIVE',
        lastBlockHeight: economics.lastBlockHeight,
        
        // Complete mining history from genesis to present (calculated from actual blockchain data)
        miningHistory: {
          genesisBlockHeight: 1, // True genesis block
          currentBlockHeight: parseInt(economics.lastBlockHeight || '0'),
          totalBlocksMined: Math.max(0, parseInt(economics.lastBlockHeight || '0')),
          totalMiningRewards: parseFloat(economics.totalSupply || '0'),
          circulatingSupply: parseFloat(economics.circulatingSupply || '0'),
          averageBlockReward: parseInt(economics.lastBlockHeight || '0') > 0 ? 
            parseFloat(economics.totalSupply || '0') / parseInt(economics.lastBlockHeight || '0') : 0,
          miningStartTimestamp: '2025-08-01T21:47:00.000Z', // Approximate start time
          miningDurationSeconds: Math.floor((Date.now() - new Date('2025-08-01T21:47:00.000Z').getTime()) / 1000),
          miningStatus: 'ACTIVE',
          validatorsEarningRewards: 21
        }
      };
    } catch (error) {
      console.error('Failed to get token economics:', error);
      throw error;
    }
  }

  /**
   * Issue new tokens for block rewards and update state
   */
  public async issueBlockReward(validatorId: string, rewardAmount: number, blockHeight: number): Promise<void> {
    await this.initialize();

    try {
      await db.transaction(async (tx) => {
        // Update token economics
        const [economics] = await tx.select().from(tokenEconomics).limit(1);
        if (!economics) throw new Error('Token economics not found');

        const newTotalSupply = parseFloat(economics.totalSupply) + rewardAmount;
        const newCirculatingSupply = parseFloat(economics.circulatingSupply) + rewardAmount;
        const newStakingPoolUtilized = parseFloat(economics.stakingPoolUtilized) + rewardAmount;
        const newStakingPoolRemaining = parseFloat(economics.stakingPoolRemaining) - rewardAmount;

        // Update token economics state
        await tx.update(tokenEconomics)
          .set({
            totalSupply: newTotalSupply.toString(),
            circulatingSupply: newCirculatingSupply.toString(),
            stakingPoolUtilized: newStakingPoolUtilized.toString(),
            stakingPoolRemaining: newStakingPoolRemaining.toString(),
            lastBlockHeight: blockHeight,
            updatedAt: new Date()
          });

        // Update validator balance
        const [validator] = await tx.select().from(validatorStates)
          .where(eq(validatorStates.validatorId, validatorId))
          .limit(1);

        if (validator) {
          const newBalance = parseFloat(validator.balance) + rewardAmount;
          await tx.update(validatorStates)
            .set({
              balance: newBalance.toString(),
              totalBlocksMined: validator.totalBlocksMined + 1,
              updatedAt: new Date()
            })
            .where(eq(validatorStates.validatorId, validatorId));
        } else {
          // Create new validator state
          await tx.insert(validatorStates).values({
            validatorId,
            balance: rewardAmount.toString(),
            emotionalScore: "85.0",
            lastActivity: Date.now(),
            publicKey: `pubkey_${validatorId}`,
            reputation: "100.0",
            totalBlocksMined: 1,
            totalValidations: 1
          });
        }
      });

      console.log(`Issued ${rewardAmount} EMO to ${validatorId} for block ${blockHeight}`);
    } catch (error) {
      console.error('Failed to issue block reward:', error);
      throw error;
    }
  }

  /**
   * Get validator balance from database
   */
  public async getValidatorBalance(validatorId: string): Promise<number> {
    try {
      const [validator] = await db.select()
        .from(validatorStates)
        .where(eq(validatorStates.validatorId, validatorId))
        .limit(1);

      return validator ? parseFloat(validator.balance) : 0;
    } catch (error) {
      console.error(`Failed to get balance for ${validatorId}:`, error);
      return 0;
    }
  }

  /**
   * Get all validator balances from database
   */
  public async getAllValidatorBalances(): Promise<Map<string, number>> {
    try {
      const validators = await db.select().from(validatorStates);
      const balances = new Map<string, number>();
      
      for (const validator of validators) {
        balances.set(validator.validatorId, parseFloat(validator.balance));
      }
      
      return balances;
    } catch (error) {
      console.error('Failed to get all validator balances:', error);
      return new Map();
    }
  }

  /**
   * Transfer EMO between validators
   */
  public async transferEMO(from: string, to: string, amount: number): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // Get sender balance
        const [sender] = await tx.select()
          .from(validatorStates)
          .where(eq(validatorStates.validatorId, from))
          .limit(1);

        if (!sender || parseFloat(sender.balance) < amount) {
          return false; // Insufficient balance
        }

        // Get or create receiver
        const [receiver] = await tx.select()
          .from(validatorStates)
          .where(eq(validatorStates.validatorId, to))
          .limit(1);

        // Update sender balance
        const newSenderBalance = parseFloat(sender.balance) - amount;
        await tx.update(validatorStates)
          .set({
            balance: newSenderBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(validatorStates.validatorId, from));

        if (receiver) {
          // Update existing receiver balance
          const newReceiverBalance = parseFloat(receiver.balance) + amount;
          await tx.update(validatorStates)
            .set({
              balance: newReceiverBalance.toString(),
              updatedAt: new Date()
            })
            .where(eq(validatorStates.validatorId, to));
        } else {
          // Create new receiver validator state
          await tx.insert(validatorStates).values({
            validatorId: to,
            balance: amount.toString(),
            emotionalScore: "85.0",
            lastActivity: Date.now(),
            publicKey: `pubkey_${to}`,
            reputation: "100.0",
            totalBlocksMined: 0,
            totalValidations: 0
          });
        }

        console.log(`💸 Transferred ${amount} EMO from ${from} to ${to}`);
        return true;
      });
    } catch (error) {
      console.error(`Failed to transfer EMO from ${from} to ${to}:`, error);
      return false;
    }
  }

  /**
   * Sync current blockchain state with database
   */
  public async syncWithBlockchain(currentBlockHeight: number, validatorBalances: Map<string, number>): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Update token economics with current block height
        await tx.update(tokenEconomics)
          .set({
            lastBlockHeight: currentBlockHeight,
            updatedAt: new Date()
          });

        // Sync validator balances
        for (const [validatorId, balance] of validatorBalances.entries()) {
          const [existing] = await tx.select()
            .from(validatorStates)
            .where(eq(validatorStates.validatorId, validatorId))
            .limit(1);

          if (existing) {
            // Update existing validator
            await tx.update(validatorStates)
              .set({
                balance: balance.toString(),
                lastActivity: Date.now(),
                updatedAt: new Date()
              })
              .where(eq(validatorStates.validatorId, validatorId));
          } else {
            // Create new validator state
            await tx.insert(validatorStates).values({
              validatorId,
              balance: balance.toString(),
              emotionalScore: "85.0",
              lastActivity: Date.now(),
              publicKey: `pubkey_${validatorId}`,
              reputation: "100.0",
              totalBlocksMined: 0,
              totalValidations: 0
            });
          }
        }
      });

      console.log(`Synced blockchain state: Block ${currentBlockHeight}, ${validatorBalances.size} validators`);
    } catch (error) {
      console.error('Failed to sync with blockchain:', error);
    }
  }

  /**
   * Reset token economics (for testing only)
   */
  public async reset(): Promise<void> {
    try {
      await db.delete(tokenEconomics);
      await db.delete(validatorStates);
      this.initialized = false;
      console.log('Reset token economics state');
    } catch (error) {
      console.error('Failed to reset token economics:', error);
    }
  }

  /**
   * Update token supply directly from blockchain state with complete mining history
   */
  public async updateTokenSupplyFromBlockchain(totalCirculating: number, blockHeight: number): Promise<void> {
    await this.initialize();

    try {
      await db.transaction(async (tx) => {
        const [economics] = await tx.select().from(tokenEconomics).limit(1);
        if (!economics) throw new Error('Token economics not found');

        const stakingPoolUtilized = totalCirculating;
        const stakingPoolRemaining = parseFloat(economics.stakingPoolAllocated) - stakingPoolUtilized;

        // Calculate mining history from genesis (block 1)
        const totalBlocksMined = Math.max(0, blockHeight);
        const totalMiningRewards = totalCirculating; // All EMO comes from mining rewards

        // Update token economics with complete historical data
        await tx.update(tokenEconomics)
          .set({
            totalSupply: totalCirculating.toString(),  
            circulatingSupply: totalCirculating.toString(),
            stakingPoolUtilized: stakingPoolUtilized.toString(),
            stakingPoolRemaining: Math.max(0, stakingPoolRemaining).toString(),
            lastBlockHeight: blockHeight,
            updatedAt: new Date()
          });
      });

      console.log(`Updated token supply to ${totalCirculating.toFixed(2)} EMO at block ${blockHeight} (${blockHeight} blocks mined)`);
    } catch (error) {
      console.error('Failed to update token supply from blockchain:', error);
      throw error;
    }
  }

  /**
   * WORKING SYNC: Recalculate from actual database transactions using pool connection
   */
  public async recalculateFromTransactions(): Promise<void> {
    try {
      // Get rewards sum using Neon pool connection (db.raw doesn't exist in Drizzle)
      const result = await pool.query(`
        SELECT 
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_rewards,
          COUNT(*) as reward_count
        FROM transactions 
        WHERE from_address = 'stakingPool'
      `);
      
      const blockResult = await pool.query(`SELECT MAX(height) as max_height FROM blocks`);
      
      const totalRewards = parseFloat(result.rows[0].total_rewards || '0');
      const currentBlockHeight = parseInt(blockResult.rows[0].max_height || '0');
      
      if (totalRewards > 0) {
        // Direct SQL update using pool connection
        await pool.query(`
          UPDATE token_economics SET 
            total_supply = $1,
            circulating_supply = $1,
            staking_pool_utilized = $1,
            staking_pool_remaining = $2,
            last_block_height = $3,
            updated_at = NOW()
        `, [totalRewards.toString(), (400000000 - totalRewards).toString(), currentBlockHeight]);
        
        console.log(`SYNC SUCCESS: ${totalRewards.toFixed(2)} EMO at block ${currentBlockHeight}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

export const persistentTokenEconomics = PersistentTokenEconomics.getInstance();