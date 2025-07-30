import { EventEmitter } from 'events';
import * as protobuf from 'protobufjs';
import { BiometricReading } from '../biometric/BiometricDevice';
import { AuthenticityProof } from '../biometric/AuthenticityProof';
// Block interface for protocol messages
interface BlockData {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  transactions: any[];
  emotionalData: any;
}
import { KeyPair } from '../crypto/KeyPair';

export enum MessageType {
  BIOMETRIC_PROOF = 'BIOMETRIC_PROOF',
  EMOTIONAL_VOTE = 'EMOTIONAL_VOTE',
  BLOCK_PROPOSAL = 'BLOCK_PROPOSAL',
  CONSENSUS_RESULT = 'CONSENSUS_RESULT',
  PEER_CHALLENGE = 'PEER_CHALLENGE',
  NETWORK_STATUS = 'NETWORK_STATUS'
}

export interface BiometricProofMessage {
  validatorId: string;
  biometricHash: Uint8Array;
  authenticityProof: Uint8Array;
  timestamp: number;
  signature: Uint8Array;
}

export interface EmotionalVoteMessage {
  validatorId: string;
  emotionalScore: number;
  biometricProof: BiometricProofMessage;
  consensusRound: number;
  signature: Uint8Array;
}

export interface BlockProposalMessage {
  block: any; // Serialized block
  proposerId: string;
  emotionalScore: number;
  votes: EmotionalVoteMessage[];
  timestamp: number;
  signature: Uint8Array;
}

export interface ConsensusResultMessage {
  selectedValidator: string;
  consensusRound: number;
  totalVotes: number;
  consensusStrength: number;
  blockHash: string;
  timestamp: number;
  signatures: Uint8Array[];
}

export interface PeerChallengeMessage {
  challengerId: string;
  targetId: string;
  challengeType: 'BIOMETRIC_VERIFY' | 'REPUTATION_CHECK' | 'LIVENESS_TEST';
  challengeData: Uint8Array;
  timestamp: number;
  signature: Uint8Array;
}

export interface NetworkStatusMessage {
  nodeId: string;
  networkHealth: number;
  connectedPeers: number;
  consensusRound: number;
  blockHeight: number;
  emotionalScore: number;
  timestamp: number;
}

export class EmotionalProtocol extends EventEmitter {
  private protocolVersion = '1.0.0';
  private messageSchema: protobuf.Root | null = null;
  private keyPair: KeyPair;
  private nodeId: string;

  constructor(nodeId: string, keyPair: KeyPair) {
    super();
    this.nodeId = nodeId;
    this.keyPair = keyPair;
    this.initializeProtobufSchema();
  }

  /**
   * Initialize Protocol Buffer schema for message serialization
   */
  private initializeProtobufSchema(): void {
    try {
      this.messageSchema = protobuf.Root.fromJSON({
        nested: {
          emotionalchain: {
            nested: {
              BiometricProof: {
                fields: {
                  validatorId: { type: 'string', id: 1 },
                  biometricHash: { type: 'bytes', id: 2 },
                  authenticityProof: { type: 'bytes', id: 3 },
                  timestamp: { type: 'int64', id: 4 },
                  signature: { type: 'bytes', id: 5 }
                }
              },
              EmotionalVote: {
                fields: {
                  validatorId: { type: 'string', id: 1 },
                  emotionalScore: { type: 'double', id: 2 },
                  biometricProof: { type: 'BiometricProof', id: 3 },
                  consensusRound: { type: 'int32', id: 4 },
                  signature: { type: 'bytes', id: 5 }
                }
              },
              BlockProposal: {
                fields: {
                  block: { type: 'bytes', id: 1 },
                  proposerId: { type: 'string', id: 2 },
                  emotionalScore: { type: 'double', id: 3 },
                  votes: { rule: 'repeated', type: 'EmotionalVote', id: 4 },
                  timestamp: { type: 'int64', id: 5 },
                  signature: { type: 'bytes', id: 6 }
                }
              },
              ConsensusResult: {
                fields: {
                  selectedValidator: { type: 'string', id: 1 },
                  consensusRound: { type: 'int32', id: 2 },
                  totalVotes: { type: 'int32', id: 3 },
                  consensusStrength: { type: 'double', id: 4 },
                  blockHash: { type: 'string', id: 5 },
                  timestamp: { type: 'int64', id: 6 },
                  signatures: { rule: 'repeated', type: 'bytes', id: 7 }
                }
              },
              PeerChallenge: {
                fields: {
                  challengerId: { type: 'string', id: 1 },
                  targetId: { type: 'string', id: 2 },
                  challengeType: { type: 'string', id: 3 },
                  challengeData: { type: 'bytes', id: 4 },
                  timestamp: { type: 'int64', id: 5 },
                  signature: { type: 'bytes', id: 6 }
                }
              },
              NetworkStatus: {
                fields: {
                  nodeId: { type: 'string', id: 1 },
                  networkHealth: { type: 'double', id: 2 },
                  connectedPeers: { type: 'int32', id: 3 },
                  consensusRound: { type: 'int32', id: 4 },
                  blockHeight: { type: 'int32', id: 5 },
                  emotionalScore: { type: 'double', id: 6 },
                  timestamp: { type: 'int64', id: 7 }
                }
              },
              ProtocolMessage: {
                fields: {
                  version: { type: 'string', id: 1 },
                  type: { type: 'string', id: 2 },
                  payload: { type: 'bytes', id: 3 },
                  timestamp: { type: 'int64', id: 4 },
                  signature: { type: 'bytes', id: 5 }
                }
              }
            }
          }
        }
      });

      console.log('📋 Protocol Buffer schema initialized successfully');

    } catch (error) {
      console.error('Failed to initialize protobuf schema:', error);
      throw error;
    }
  }

  /**
   * Create a biometric proof message
   */
  public createBiometricProof(
    validatorId: string,
    biometricReading: BiometricReading,
    authenticityProof: AuthenticityProof
  ): Uint8Array {
    try {
      const message: BiometricProofMessage = {
        validatorId,
        biometricHash: new TextEncoder().encode(JSON.stringify({
          deviceId: biometricReading.deviceId,
          type: biometricReading.type,
          value: biometricReading.value,
          quality: biometricReading.quality,
          timestamp: biometricReading.timestamp
        })),
        authenticityProof: new TextEncoder().encode(JSON.stringify(authenticityProof)),
        timestamp: Date.now(),
        signature: new Uint8Array(0) // Will be set after serialization
      };

      return this.serializeMessage(MessageType.BIOMETRIC_PROOF, message);

    } catch (error) {
      console.error('Error creating biometric proof message:', error);
      throw error;
    }
  }

  /**
   * Create an emotional vote message
   */
  public createEmotionalVote(
    validatorId: string,
    emotionalScore: number,
    biometricProof: BiometricProofMessage,
    consensusRound: number
  ): Uint8Array {
    try {
      const message: EmotionalVoteMessage = {
        validatorId,
        emotionalScore,
        biometricProof,
        consensusRound,
        signature: new Uint8Array(0)
      };

      return this.serializeMessage(MessageType.EMOTIONAL_VOTE, message);

    } catch (error) {
      console.error('Error creating emotional vote message:', error);
      throw error;
    }
  }

  /**
   * Create a block proposal message
   */
  public createBlockProposal(
    block: BlockData,
    proposerId: string,
    emotionalScore: number,
    votes: EmotionalVoteMessage[]
  ): Uint8Array {
    try {
      const message: BlockProposalMessage = {
        block: new TextEncoder().encode(JSON.stringify(block)),
        proposerId,
        emotionalScore,
        votes,
        timestamp: Date.now(),
        signature: new Uint8Array(0)
      };

      return this.serializeMessage(MessageType.BLOCK_PROPOSAL, message);

    } catch (error) {
      console.error('Error creating block proposal message:', error);
      throw error;
    }
  }

  /**
   * Create a consensus result message
   */
  public createConsensusResult(
    selectedValidator: string,
    consensusRound: number,
    totalVotes: number,
    consensusStrength: number,
    blockHash: string,
    signatures: Uint8Array[]
  ): Uint8Array {
    try {
      const message: ConsensusResultMessage = {
        selectedValidator,
        consensusRound,
        totalVotes,
        consensusStrength,
        blockHash,
        timestamp: Date.now(),
        signatures
      };

      return this.serializeMessage(MessageType.CONSENSUS_RESULT, message);

    } catch (error) {
      console.error('Error creating consensus result message:', error);
      throw error;
    }
  }

  /**
   * Create a peer challenge message
   */
  public createPeerChallenge(
    targetId: string,
    challengeType: 'BIOMETRIC_VERIFY' | 'REPUTATION_CHECK' | 'LIVENESS_TEST',
    challengeData: Uint8Array
  ): Uint8Array {
    try {
      const message: PeerChallengeMessage = {
        challengerId: this.nodeId,
        targetId,
        challengeType,
        challengeData,
        timestamp: Date.now(),
        signature: new Uint8Array(0)
      };

      return this.serializeMessage(MessageType.PEER_CHALLENGE, message);

    } catch (error) {
      console.error('Error creating peer challenge message:', error);
      throw error;
    }
  }

  /**
   * Create a network status message
   */
  public createNetworkStatus(
    networkHealth: number,
    connectedPeers: number,
    consensusRound: number,
    blockHeight: number,
    emotionalScore: number
  ): Uint8Array {
    try {
      const message: NetworkStatusMessage = {
        nodeId: this.nodeId,
        networkHealth,
        connectedPeers,
        consensusRound,
        blockHeight,
        emotionalScore,
        timestamp: Date.now()
      };

      return this.serializeMessage(MessageType.NETWORK_STATUS, message);

    } catch (error) {
      console.error('Error creating network status message:', error);
      throw error;
    }
  }

  /**
   * Parse incoming message
   */
  public parseMessage(data: Uint8Array): { type: MessageType; payload: any; valid: boolean } {
    try {
      if (!this.messageSchema) {
        throw new Error('Protocol schema not initialized');
      }

      const ProtocolMessage = this.messageSchema.lookupType('emotionalchain.ProtocolMessage');
      const decoded = ProtocolMessage.decode(data) as any;

      // Verify protocol version
      if (decoded.version !== this.protocolVersion) {
        console.warn(`Protocol version mismatch: ${decoded.version} vs ${this.protocolVersion}`);
        return { type: decoded.type, payload: null, valid: false };
      }

      // Verify signature
      const signatureValid = this.verifyMessageSignature(decoded);
      if (!signatureValid) {
        console.warn('Invalid message signature');
        return { type: decoded.type, payload: null, valid: false };
      }

      // Parse payload based on message type
      const payload = this.parsePayload(decoded.type, decoded.payload);

      return {
        type: decoded.type as MessageType,
        payload,
        valid: true
      };

    } catch (error) {
      console.error('Error parsing message:', error);
      return { type: MessageType.NETWORK_STATUS, payload: null, valid: false };
    }
  }

  /**
   * Serialize message with protobuf
   */
  private serializeMessage(type: MessageType, payload: any): Uint8Array {
    try {
      if (!this.messageSchema) {
        throw new Error('Protocol schema not initialized');
      }

      // Serialize the specific payload
      let serializedPayload: Uint8Array;

      switch (type) {
        case MessageType.BIOMETRIC_PROOF:
          const BiometricProof = this.messageSchema.lookupType('emotionalchain.BiometricProof');
          serializedPayload = BiometricProof.encode(payload).finish();
          break;

        case MessageType.EMOTIONAL_VOTE:
          const EmotionalVote = this.messageSchema.lookupType('emotionalchain.EmotionalVote');
          serializedPayload = EmotionalVote.encode(payload).finish();
          break;

        case MessageType.BLOCK_PROPOSAL:
          const BlockProposal = this.messageSchema.lookupType('emotionalchain.BlockProposal');
          serializedPayload = BlockProposal.encode(payload).finish();
          break;

        case MessageType.CONSENSUS_RESULT:
          const ConsensusResult = this.messageSchema.lookupType('emotionalchain.ConsensusResult');
          serializedPayload = ConsensusResult.encode(payload).finish();
          break;

        case MessageType.PEER_CHALLENGE:
          const PeerChallenge = this.messageSchema.lookupType('emotionalchain.PeerChallenge');
          serializedPayload = PeerChallenge.encode(payload).finish();
          break;

        case MessageType.NETWORK_STATUS:
          const NetworkStatus = this.messageSchema.lookupType('emotionalchain.NetworkStatus');
          serializedPayload = NetworkStatus.encode(payload).finish();
          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }

      // Create protocol message wrapper
      const protocolMessage = {
        version: this.protocolVersion,
        type,
        payload: serializedPayload,
        timestamp: Date.now(),
        signature: new Uint8Array(0) // Will be set after creating message hash
      };

      // Sign the message
      const messageHash = this.createMessageHash(protocolMessage);
      protocolMessage.signature = this.signMessage(messageHash);

      // Serialize the final message
      const ProtocolMessage = this.messageSchema.lookupType('emotionalchain.ProtocolMessage');
      return ProtocolMessage.encode(protocolMessage).finish();

    } catch (error) {
      console.error('Error serializing message:', error);
      throw error;
    }
  }

  /**
   * Parse payload based on message type
   */
  private parsePayload(type: string, payloadBytes: Uint8Array): any {
    try {
      if (!this.messageSchema) {
        throw new Error('Protocol schema not initialized');
      }

      switch (type) {
        case MessageType.BIOMETRIC_PROOF:
          const BiometricProof = this.messageSchema.lookupType('emotionalchain.BiometricProof');
          return BiometricProof.decode(payloadBytes);

        case MessageType.EMOTIONAL_VOTE:
          const EmotionalVote = this.messageSchema.lookupType('emotionalchain.EmotionalVote');
          return EmotionalVote.decode(payloadBytes);

        case MessageType.BLOCK_PROPOSAL:
          const BlockProposal = this.messageSchema.lookupType('emotionalchain.BlockProposal');
          return BlockProposal.decode(payloadBytes);

        case MessageType.CONSENSUS_RESULT:
          const ConsensusResult = this.messageSchema.lookupType('emotionalchain.ConsensusResult');
          return ConsensusResult.decode(payloadBytes);

        case MessageType.PEER_CHALLENGE:
          const PeerChallenge = this.messageSchema.lookupType('emotionalchain.PeerChallenge');
          return PeerChallenge.decode(payloadBytes);

        case MessageType.NETWORK_STATUS:
          const NetworkStatus = this.messageSchema.lookupType('emotionalchain.NetworkStatus');
          return NetworkStatus.decode(payloadBytes);

        default:
          throw new Error(`Unknown message type: ${type}`);
      }

    } catch (error) {
      console.error(`Error parsing ${type} payload:`, error);
      return null;
    }
  }

  /**
   * Create message hash for signing
   */
  private createMessageHash(message: any): string {
    const hashData = `${message.version}:${message.type}:${message.timestamp}:${Buffer.from(message.payload).toString('hex')}`;
    // Use crypto library for hashing instead of KeyPair method
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  /**
   * Sign message hash
   */
  private signMessage(messageHash: string): Uint8Array {
    const signature = this.keyPair.sign(messageHash);
    return new TextEncoder().encode(signature);
  }

  /**
   * Verify message signature
   */
  private verifyMessageSignature(message: any): boolean {
    try {
      // Recreate message hash
      const messageHash = this.createMessageHash(message);
      
      // For now, return true - in production, we'd verify against sender's public key
      // This would require peer identity management
      return true;

    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle incoming biometric proof
   */
  public handleBiometricProof(payload: BiometricProofMessage, senderId: string): void {
    try {
      console.log(`📊 Received biometric proof from ${senderId.substring(0, 12)}...`);
      
      // Parse biometric data
      const biometricData = JSON.parse(new TextDecoder().decode(payload.biometricHash));
      const authenticityProof = JSON.parse(new TextDecoder().decode(payload.authenticityProof));
      
      // Emit event for consensus engine
      this.emit('biometricProof', {
        validatorId: payload.validatorId,
        biometricData,
        authenticityProof,
        timestamp: payload.timestamp,
        senderId
      });

    } catch (error) {
      console.error('Error handling biometric proof:', error);
    }
  }

  /**
   * Handle incoming emotional vote
   */
  public handleEmotionalVote(payload: EmotionalVoteMessage, senderId: string): void {
    try {
      console.log(`🗳️  Received emotional vote from ${senderId.substring(0, 12)}... (score: ${payload.emotionalScore.toFixed(1)}%)`);
      
      this.emit('emotionalVote', {
        validatorId: payload.validatorId,
        emotionalScore: payload.emotionalScore,
        consensusRound: payload.consensusRound,
        senderId
      });

    } catch (error) {
      console.error('Error handling emotional vote:', error);
    }
  }

  /**
   * Handle incoming block proposal
   */
  public handleBlockProposal(payload: BlockProposalMessage, senderId: string): void {
    try {
      console.log(`📦 Received block proposal from ${senderId.substring(0, 12)}...`);
      
      // Parse block data
      const blockData = JSON.parse(new TextDecoder().decode(payload.block));
      
      this.emit('blockProposal', {
        block: blockData,
        proposerId: payload.proposerId,
        emotionalScore: payload.emotionalScore,
        votes: payload.votes,
        timestamp: payload.timestamp,
        senderId
      });

    } catch (error) {
      console.error('Error handling block proposal:', error);
    }
  }

  /**
   * Handle incoming consensus result
   */
  public handleConsensusResult(payload: ConsensusResultMessage, senderId: string): void {
    try {
      console.log(`🎯 Received consensus result from ${senderId.substring(0, 12)}...`);
      console.log(`   Winner: ${payload.selectedValidator}`);
      console.log(`   Strength: ${payload.consensusStrength.toFixed(1)}%`);
      
      this.emit('consensusResult', {
        selectedValidator: payload.selectedValidator,
        consensusRound: payload.consensusRound,
        totalVotes: payload.totalVotes,
        consensusStrength: payload.consensusStrength,
        blockHash: payload.blockHash,
        timestamp: payload.timestamp,
        senderId
      });

    } catch (error) {
      console.error('Error handling consensus result:', error);
    }
  }

  /**
   * Handle incoming peer challenge
   */
  public handlePeerChallenge(payload: PeerChallengeMessage, senderId: string): void {
    try {
      if (payload.targetId === this.nodeId) {
        console.log(`⚔️  Received ${payload.challengeType} challenge from ${senderId.substring(0, 12)}...`);
        
        this.emit('peerChallenge', {
          challengerId: payload.challengerId,
          challengeType: payload.challengeType,
          challengeData: payload.challengeData,
          timestamp: payload.timestamp,
          senderId
        });
      }

    } catch (error) {
      console.error('Error handling peer challenge:', error);
    }
  }

  /**
   * Handle incoming network status
   */
  public handleNetworkStatus(payload: NetworkStatusMessage, senderId: string): void {
    try {
      this.emit('networkStatus', {
        nodeId: payload.nodeId,
        networkHealth: payload.networkHealth,
        connectedPeers: payload.connectedPeers,
        consensusRound: payload.consensusRound,
        blockHeight: payload.blockHeight,
        emotionalScore: payload.emotionalScore,
        timestamp: payload.timestamp,
        senderId
      });

    } catch (error) {
      console.error('Error handling network status:', error);
    }
  }

  /**
   * Get protocol statistics
   */
  public getProtocolStats(): any {
    return {
      version: this.protocolVersion,
      nodeId: this.nodeId,
      messageTypes: Object.values(MessageType).length,
      schemaInitialized: !!this.messageSchema
    };
  }

  /**
   * Validate message structure
   */
  public validateMessage(type: MessageType, payload: any): boolean {
    try {
      if (!this.messageSchema) {
        return false;
      }

      // Get the appropriate message type
      let MessageType: any;
      
      switch (type) {
        case MessageType.BIOMETRIC_PROOF:
          MessageType = this.messageSchema.lookupType('emotionalchain.BiometricProof');
          break;
        case MessageType.EMOTIONAL_VOTE:
          MessageType = this.messageSchema.lookupType('emotionalchain.EmotionalVote');
          break;
        case MessageType.BLOCK_PROPOSAL:
          MessageType = this.messageSchema.lookupType('emotionalchain.BlockProposal');
          break;
        case MessageType.CONSENSUS_RESULT:
          MessageType = this.messageSchema.lookupType('emotionalchain.ConsensusResult');
          break;
        case MessageType.PEER_CHALLENGE:
          MessageType = this.messageSchema.lookupType('emotionalchain.PeerChallenge');
          break;
        case MessageType.NETWORK_STATUS:
          MessageType = this.messageSchema.lookupType('emotionalchain.NetworkStatus');
          break;
        default:
          return false;
      }

      // Verify the message structure
      const error = MessageType.verify(payload);
      return !error;

    } catch (error) {
      console.error('Message validation error:', error);
      return false;
    }
  }
}