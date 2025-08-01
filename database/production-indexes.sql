-- EmotionalChain Production Database Indexes
-- CRITICAL: Use CONCURRENTLY to avoid blocking live operations
-- Execute during low-traffic periods for optimal performance

-- =====================================================
-- CONSENSUS PERFORMANCE INDEXES
-- =====================================================

-- Primary consensus round lookup index
-- Used by: getConsensusHealth(), runConsensusEpoch()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_consensus_lookup 
ON blocks (height DESC, validator_id, emotional_score DESC, timestamp DESC)
WHERE timestamp > extract(epoch from now() - interval '24 hours') * 1000;

-- Block validation index with covering columns
-- Used by: block validation, fork resolution
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_validation_cover 
ON blocks (hash, previous_hash) 
INCLUDE (height, timestamp, validator_id, emotional_score, transaction_count);

-- Validator consensus participation index
-- Used by: validator selection, reputation calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_validator_participation 
ON blocks (validator_id, timestamp DESC) 
INCLUDE (emotional_score, transaction_count, block_reward)
WHERE timestamp > extract(epoch from now() - interval '7 days') * 1000;

-- =====================================================
-- VALIDATOR STATE INDEXES
-- =====================================================

-- Active validators with emotional filtering - CRITICAL for consensus
-- Used by: getActiveValidatorsOptimized(), validator selection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validator_states_active_emotional 
ON validator_states (is_active, emotional_score DESC, reputation DESC, last_activity DESC)
WHERE is_active = true AND emotional_score >= 75;

-- Validator balance and staking index
-- Used by: staking calculations, validator ranking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validator_states_staking 
ON validator_states (balance DESC, total_validations DESC) 
INCLUDE (validator_id, emotional_score, reputation)
WHERE is_active = true;

-- Geographic validator distribution index
-- Used by: multi-region deployment, geographic diversity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validator_states_geographic 
ON validator_states (region, is_active) 
INCLUDE (validator_id, emotional_score, balance, last_activity)
WHERE is_active = true;

-- Validator performance tracking index
-- Used by: performance analytics, validator scoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validator_states_performance 
ON validator_states (total_validations DESC, total_blocks_mined DESC, uptime DESC) 
INCLUDE (validator_id, emotional_score, reputation, balance);

-- =====================================================
-- BIOMETRIC DATA INDEXES
-- =====================================================

-- Real-time biometric validation index - HIGH TRAFFIC
-- Used by: biometric data validation, authenticity checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biometric_data_realtime_validation 
ON biometric_data (validator_id, timestamp DESC, reading_type) 
INCLUDE (value, quality, authenticity_proof)
WHERE timestamp > extract(epoch from now() - interval '1 hour') * 1000;

-- Biometric quality and authenticity index
-- Used by: consensus participant selection, data quality assessment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biometric_data_quality_auth 
ON biometric_data (reading_type, quality DESC, timestamp DESC) 
INCLUDE (validator_id, value, authenticity_proof)
WHERE quality >= 0.7;

-- Device-specific biometric tracking
-- Used by: device performance monitoring, anomaly detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biometric_data_device_tracking 
ON biometric_data (device_id, validator_id, timestamp DESC) 
INCLUDE (reading_type, value, quality);

-- Historical biometric analysis index
-- Used by: trend analysis, validator behavioral patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biometric_data_historical 
ON biometric_data (validator_id, reading_type, timestamp DESC) 
WHERE timestamp > extract(epoch from now() - interval '30 days') * 1000;

-- =====================================================
-- TRANSACTION PROCESSING INDEXES
-- =====================================================

-- Transaction status processing index - CRITICAL for throughput
-- Used by: transaction confirmation, mempool management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_processing 
ON transactions (status, created_at DESC) 
INCLUDE (id, hash, from_address, to_address, amount, block_hash)
WHERE status IN ('pending', 'confirmed');

-- Block transaction lookup index
-- Used by: block validation, transaction verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_block_lookup 
ON transactions (block_hash, transaction_index) 
INCLUDE (hash, status, gas_used, emotional_score_required);

-- Address-based transaction history
-- Used by: wallet balance calculation, transaction history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_address_history 
ON transactions (from_address, created_at DESC) 
INCLUDE (to_address, amount, status, block_hash, transaction_fee);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_to_address_history 
ON transactions (to_address, created_at DESC) 
INCLUDE (from_address, amount, status, block_hash, transaction_fee);

-- High-value transaction monitoring
-- Used by: security monitoring, large transaction alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_high_value 
ON transactions (amount DESC, created_at DESC) 
INCLUDE (from_address, to_address, status, emotional_score_required)
WHERE amount > 1000; -- Transactions > 1000 EMO

-- =====================================================
-- SMART CONTRACT INDEXES
-- =====================================================

-- Active smart contracts index
-- Used by: contract execution, wellness program management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_smart_contracts_active 
ON smart_contracts (is_active, type, deployed_at DESC) 
INCLUDE (contract_address, name, emotional_threshold, total_value);

-- Contract participant lookup
-- Used by: participant management, reward distribution
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_smart_contracts_participants 
ON smart_contracts USING GIN (participants)
WHERE is_active = true;

-- =====================================================
-- WELLNESS & STAKING INDEXES
-- =====================================================

-- Active wellness goals tracking
-- Used by: wellness program monitoring, reward calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wellness_goals_active 
ON wellness_goals (completed, end_date) 
INCLUDE (participant, target_score, current_progress, reward)
WHERE completed = false AND end_date > NOW();

-- Wellness progress monitoring
-- Used by: progress tracking, biometric correlation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wellness_goals_progress 
ON wellness_goals (participant, current_progress DESC, start_date DESC) 
INCLUDE (target_score, reward, completed);

-- =====================================================
-- CROSS-CHAIN & BRIDGE INDEXES
-- =====================================================

-- Bridge transaction processing
-- Used by: cross-chain transaction validation, bridge monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bridge_transactions_processing 
ON bridge_transactions (status, created_at DESC) 
INCLUDE (bridge_id, source_chain, target_chain, amount, sender, recipient)
WHERE status IN ('pending', 'confirmed');

-- Cross-chain transaction lookup
-- Used by: transaction tracking across chains
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bridge_transactions_tracking 
ON bridge_transactions (source_tx_hash) 
INCLUDE (target_tx_hash, status, completed_at);

-- =====================================================
-- QUANTUM & PRIVACY INDEXES
-- =====================================================

-- Active quantum key pairs
-- Used by: quantum-resistant cryptography, key management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quantum_key_pairs_active 
ON quantum_key_pairs (validator_id, status, algorithm) 
INCLUDE (public_key, security_level, created_at, expires_at)
WHERE status = 'active';

-- Privacy proof validation
-- Used by: zero-knowledge proof verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_privacy_proofs_validation 
ON privacy_proofs (proof_type, is_valid, created_at DESC) 
INCLUDE (validator_id, commitment, nullifier_hash)
WHERE is_valid = true;

-- =====================================================
-- AI & ANALYTICS INDEXES
-- =====================================================

-- AI model performance tracking
-- Used by: model accuracy monitoring, anomaly detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_model_data_performance 
ON ai_model_data (model_type, accuracy DESC, training_date DESC) 
INCLUDE (model_name, data_points_used, validation_accuracy);

-- =====================================================
-- MAINTENANCE COMMANDS
-- =====================================================

-- Analyze tables after index creation for optimal query planning
ANALYZE blocks;
ANALYZE validator_states;
ANALYZE biometric_data;
ANALYZE transactions;
ANALYZE smart_contracts;
ANALYZE wellness_goals;
ANALYZE bridge_transactions;
ANALYZE quantum_key_pairs;
ANALYZE privacy_proofs;
ANALYZE ai_model_data;

-- Monitor index usage after deployment
-- Query to check index effectiveness:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC;
*/

-- Clean up unused indexes (run after monitoring period):
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
*/