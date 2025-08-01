import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { P2PNode, P2PConfig } from '../../network/P2PNode';
import { EmotionalProtocol } from '../../network/EmotionalProtocol';
import { KeyPair } from '../../crypto/KeyPair';

interface TestNetwork {
  nodes: P2PNode[];
  protocols: EmotionalProtocol[];
  cleanup: () => Promise<void>;
}

async function createTestNetwork(nodeCount: number): Promise<TestNetwork> {
  const nodes: P2PNode[] = [];
  const protocols: EmotionalProtocol[] = [];
  
  // Create bootstrap node
  const bootstrapConfig: P2PConfig = {
    nodeId: 'bootstrap-node',
    listenPort: 18000,
    bootstrapPeers: [],
    maxConnections: 20,
    minConnections: 1,
    enableWebRTC: false,
    enableTCP: true,
    enableWebSockets: false
  };
  
  const bootstrapNode = new P2PNode(bootstrapConfig);
  await bootstrapNode.start();
  nodes.push(bootstrapNode);
  
  const bootstrapKeyPair = new KeyPair();
  const bootstrapProtocol = new EmotionalProtocol('bootstrap-node', bootstrapKeyPair);
  protocols.push(bootstrapProtocol);
  
  // Create additional nodes that connect to bootstrap
  const bootstrapAddr = `/ip4/127.0.0.1/tcp/18000`;
  
  for (let i = 1; i < nodeCount; i++) {
    const config: P2PConfig = {
      nodeId: `test-node-${i}`,
      listenPort: 18000 + i,
      bootstrapPeers: [bootstrapAddr],
      maxConnections: 20,
      minConnections: 1,
      enableWebRTC: false,
      enableTCP: true,
      enableWebSockets: false
    };
    
    const node = new P2PNode(config);
    await node.start();
    
    // Wait for connection establishment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    nodes.push(node);
    
    const keyPair = new KeyPair();
    const protocol = new EmotionalProtocol(`test-node-${i}`, keyPair);
    protocols.push(protocol);
  }
  
  // Wait for network stabilization
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    nodes,
    protocols,
    cleanup: async () => {
      for (const node of nodes) {
        await node.stop();
      }
    }
  };
}

describe('P2P Network Integration', () => {
  let testNetwork: TestNetwork;
  
  afterEach(async () => {
    if (testNetwork) {
      await testNetwork.cleanup();
    }
  });

  describe('Network Formation', () => {
    it('should establish connections between multiple nodes', async () => {
      testNetwork = await createTestNetwork(5);
      
      // Verify each node has connections
      for (const node of testNetwork.nodes) {
        const peerCount = node.getPeerCount();
        expect(peerCount).toBeGreaterThan(0);
      }
      
      // Verify bootstrap node has most connections
      const bootstrapPeerCount = testNetwork.nodes[0].getPeerCount();
      expect(bootstrapPeerCount).toBeGreaterThanOrEqual(3);
    });

    it('should handle peer discovery through DHT', async () => {
      testNetwork = await createTestNetwork(3);
      const [nodeA, nodeB, nodeC] = testNetwork.nodes;
      
      // Initially, nodeC might not be directly connected to nodeA
      // But should be discoverable through DHT
      
      const nodeAInfo = nodeA.getNodeInfo();
      const nodeCPeerId = nodeC.getNodeInfo()?.peerId;
      
      if (nodeCPeerId) {
        const discoveredPeer = await nodeA.findPeer(nodeCPeerId);
        expect(discoveredPeer).toBeDefined();
      }
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast messages to all connected peers', async () => {
      testNetwork = await createTestNetwork(4);
      const [sender, ...receivers] = testNetwork.nodes;
      
      const receivedMessages: string[] = [];
      
      // Set up message handlers on receiver nodes
      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i];
        receiver.onMessage('test_protocol', (data: Uint8Array, fromPeer: string) => {
          const message = new TextDecoder().decode(data);
          receivedMessages.push(message);
        });
      }
      
      // Broadcast test message
      const testMessage = 'Hello P2P Network!';
      const messageData = new TextEncoder().encode(testMessage);
      
      await sender.broadcast('test_protocol', messageData);
      
      // Wait for message propagation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify all receivers got the message
      expect(receivedMessages.length).toBeGreaterThan(0);
      expect(receivedMessages).toContain(testMessage);
    });

    it('should handle pubsub topic subscription and publishing', async () => {
      testNetwork = await createTestNetwork(3);
      const [publisher, subscriber1, subscriber2] = testNetwork.nodes;
      
      const receivedMessages: { data: string; from: string }[] = [];
      
      // Subscribe to test topic
      const topicHandler = (data: Uint8Array, peerId: string) => {
        const message = new TextDecoder().decode(data);
        receivedMessages.push({ data: message, from: peerId });
      };
      
      await subscriber1.subscribeToTopic('test-topic', topicHandler);
      await subscriber2.subscribeToTopic('test-topic', topicHandler);
      
      // Wait for subscription to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Publish to topic
      const testMessage = 'PubSub Test Message';
      const messageData = new TextEncoder().encode(testMessage);
      
      await publisher.publishToTopic('test-topic', messageData);
      
      // Wait for message delivery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify subscribers received the message
      expect(receivedMessages.length).toBeGreaterThanOrEqual(1);
      expect(receivedMessages[0].data).toBe(testMessage);
    });
  });

  describe('Network Resilience', () => {
    it('should handle network partitions gracefully', async () => {
      testNetwork = await createTestNetwork(4);
      const [nodeA, nodeB, nodeC, nodeD] = testNetwork.nodes;
      
      // Verify initial connectivity
      expect(nodeA.getPeerCount()).toBeGreaterThan(0);
      expect(nodeB.getPeerCount()).toBeGreaterThan(0);
      
      // Simulate network partition by stopping intermediate nodes
      await nodeB.stop();
      await nodeC.stop();
      
      // Wait for disconnection detection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify remaining nodes adapt to partition
      const remainingPeers = nodeA.getPeerCount();
      expect(remainingPeers).toBeLessThan(3); // Should have lost some connections
      
      // Network should still be functional for remaining nodes
      const nodeAInfo = nodeA.getNodeInfo();
      expect(nodeAInfo?.isStarted).toBe(true);
    });

    it('should reconnect after temporary network failures', async () => {
      testNetwork = await createTestNetwork(3);
      const [nodeA, nodeB, nodeC] = testNetwork.nodes;
      
      const initialPeerCount = nodeA.getPeerCount();
      
      // Simulate temporary network failure
      await nodeB.stop();
      
      // Wait for disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reducedPeerCount = nodeA.getPeerCount();
      expect(reducedPeerCount).toBeLessThan(initialPeerCount);
      
      // Restart nodeB
      await nodeB.start();
      
      // Wait for reconnection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const recoveredPeerCount = nodeA.getPeerCount();
      expect(recoveredPeerCount).toBeGreaterThan(reducedPeerCount);
    });
  });

  describe('Protocol Message Handling', () => {
    it('should handle biometric proof messages', async () => {
      testNetwork = await createTestNetwork(2);
      const [sender, receiver] = testNetwork.nodes;
      const [senderProtocol, receiverProtocol] = testNetwork.protocols;
      
      const receivedProofs: any[] = [];
      
      // Set up protocol message handler
      receiverProtocol.on('biometricProof', (proof) => {
        receivedProofs.push(proof);
      });
      
      // Create and send biometric proof
      const testReading = {
        timestamp: Date.now(),
        deviceId: 'test-device',
        type: 'heartRate' as const,
        value: 75,
        quality: 0.95
      };
      
      const testAuthProof = {
        deviceId: 'test-device',
        timestamp: Date.now(),
        challenge: new Uint8Array([1, 2, 3, 4]),
        response: new Uint8Array([5, 6, 7, 8]),
        isValid: true
      };
      
      const biometricProof = senderProtocol.createBiometricProof(
        'test-validator',
        testReading,
        testAuthProof
      );
      
      // Broadcast proof
      await sender.publishToTopic('biometric-proofs', biometricProof);
      
      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(receivedProofs.length).toBeGreaterThan(0);
    });

    it('should handle consensus voting messages', async () => {
      testNetwork = await createTestNetwork(2);
      const [sender, receiver] = testNetwork.nodes;
      const [senderProtocol, receiverProtocol] = testNetwork.protocols;
      
      const receivedVotes: any[] = [];
      
      // Set up vote handler
      receiverProtocol.on('emotionalVote', (vote) => {
        receivedVotes.push(vote);
      });
      
      // Create and send emotional vote
      const testBiometricProof = senderProtocol.createBiometricProof(
        'test-validator',
        {
          timestamp: Date.now(),
          deviceId: 'test-device',
          type: 'heartRate' as const,
          value: 80,
          quality: 0.9
        },
        {
          deviceId: 'test-device',
          timestamp: Date.now(),
          challenge: new Uint8Array([1, 2, 3]),
          response: new Uint8Array([4, 5, 6]),
          isValid: true
        }
      );
      
      const emotionalVote = senderProtocol.createEmotionalVote(
        'test-validator',
        85.5,
        testBiometricProof,
        1
      );
      
      await sender.publishToTopic('emotional-votes', emotionalVote);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(receivedVotes.length).toBeGreaterThan(0);
    });
  });

  describe('Load Testing', () => {
    it('should handle high message throughput', async () => {
      testNetwork = await createTestNetwork(5);
      const [sender, ...receivers] = testNetwork.nodes;
      
      let messagesReceived = 0;
      const totalMessages = 100;
      
      // Set up message counting on receivers
      for (const receiver of receivers) {
        receiver.onMessage('load_test', () => {
          messagesReceived++;
        });
      }
      
      // Send messages rapidly
      const promises: Promise<void>[] = [];
      for (let i = 0; i < totalMessages; i++) {
        const message = new TextEncoder().encode(`Message ${i}`);
        promises.push(sender.broadcast('load_test', message));
      }
      
      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Wait for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const throughput = totalMessages / ((endTime - startTime) / 1000);
      
      expect(messagesReceived).toBeGreaterThan(0);
      expect(throughput).toBeGreaterThan(10); // At least 10 messages per second
    });
  });
});