import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Hash,
  UserCheck,
  Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PrivacyDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proofForm, setProofForm] = useState({
    validatorId: '',
    heartRate: 72,
    stressLevel: 25,
    focusLevel: 85,
    emotionalState: 80
  });
  const [verificationForm, setVerificationForm] = useState({
    proofHash: '',
    commitmentHash: '',
    validatorId: '',
    expectedThreshold: 75
  });

  // Get privacy system statistics
  const { data: privacyStats, isLoading } = useQuery({
    queryKey: ['/api/privacy/stats'],
    refetchInterval: 30000
  });

  // Generate ZK proof mutation
  const generateProofMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/privacy/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validatorId: data.validatorId,
          biometricData: {
            heartRate: data.heartRate,
            stressLevel: data.stressLevel,
            focusLevel: data.focusLevel,
            emotionalState: data.emotionalState
          },
          blockHeight: Math.floor(Math.random() * 10000) + 1000
        })
      });
      if (!response.ok) throw new Error('Failed to generate proof');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Zero-Knowledge Proof Generated",
        description: `Proof hash: ${data.proof.proofHash.substring(0, 16)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/privacy/stats'] });
    }
  });

  // Verify proof mutation
  const verifyProofMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/privacy/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to verify proof');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Proof Verification Complete",
        description: `Verification result: ${data.verification.isValid ? 'Valid' : 'Invalid'} (${(data.verification.confidence * 100).toFixed(1)}% confidence)`,
        variant: data.verification.isValid ? "default" : "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Privacy Layer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Zero-knowledge proof generation and biometric data privacy management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-600">PRIVACY ACTIVE</span>
        </div>
      </div>

      {/* Privacy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proofs</CardTitle>
            <Hash className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privacyStats?.totalProofs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Proofs</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privacyStats?.validProofs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {privacyStats?.totalProofs ? 
                ((privacyStats.validProofs / privacyStats.totalProofs) * 100).toFixed(1) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Validators</CardTitle>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privacyStats?.uniqueValidators || 0}</div>
            <p className="text-xs text-muted-foreground">
              Using privacy layer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Privacy Level</CardTitle>
            <Lock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZK</div>
            <p className="text-xs text-muted-foreground">
              Zero-knowledge proofs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Protection Features
          </CardTitle>
          <CardDescription>
            Active privacy mechanisms protecting biometric data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {privacyStats?.securityFeatures?.map((feature: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Proof</TabsTrigger>
          <TabsTrigger value="verify">Verify Proof</TabsTrigger>
          <TabsTrigger value="history">Proof History</TabsTrigger>
          <TabsTrigger value="data-location">Data Storage</TabsTrigger>
        </TabsList>

        {/* Generate Proof Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Generate Zero-Knowledge Proof
              </CardTitle>
              <CardDescription>
                Create cryptographic proof for biometric data without revealing actual values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="validatorId">Validator ID</Label>
                    <Input
                      id="validatorId"
                      placeholder="val_001"
                      value={proofForm.validatorId}
                      onChange={(e) => setProofForm(prev => ({ ...prev, validatorId: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="heartRate">Heart Rate (BPM)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={proofForm.heartRate}
                      onChange={(e) => setProofForm(prev => ({ ...prev, heartRate: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="stressLevel">Stress Level (0-100)</Label>
                    <Input
                      id="stressLevel"
                      type="number"
                      min="0"
                      max="100"
                      value={proofForm.stressLevel}
                      onChange={(e) => setProofForm(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="focusLevel">Focus Level (0-100)</Label>
                    <Input
                      id="focusLevel"
                      type="number"
                      min="0"
                      max="100"
                      value={proofForm.focusLevel}
                      onChange={(e) => setProofForm(prev => ({ ...prev, focusLevel: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emotionalState">Emotional State (0-100)</Label>
                    <Input
                      id="emotionalState"
                      type="number"
                      min="0"
                      max="100"
                      value={proofForm.emotionalState}
                      onChange={(e) => setProofForm(prev => ({ ...prev, emotionalState: parseInt(e.target.value) }))}
                    />
                  </div>

                  <Button 
                    onClick={() => generateProofMutation.mutate(proofForm)}
                    disabled={generateProofMutation.isPending || !proofForm.validatorId}
                    className="w-full"
                  >
                    {generateProofMutation.isPending ? 'Generating...' : 'Generate ZK Proof'}
                  </Button>
                </div>
              </div>

              {generateProofMutation.data && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Proof Generated Successfully</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Proof Hash:</span>
                      <code className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded">
                        {generateProofMutation.data.proof.proofHash}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Commitment Hash:</span>
                      <code className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded">
                        {generateProofMutation.data.proof.commitmentHash}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Validity:</span>
                      <Badge variant={generateProofMutation.data.proof.isValid ? "secondary" : "destructive"}>
                        {generateProofMutation.data.proof.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Proof Tab */}
        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Verify Zero-Knowledge Proof
              </CardTitle>
              <CardDescription>
                Verify proof authenticity without accessing original biometric data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proofHash">Proof Hash</Label>
                    <Input
                      id="proofHash"
                      placeholder="Enter proof hash..."
                      value={verificationForm.proofHash}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, proofHash: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="commitmentHash">Commitment Hash</Label>
                    <Input
                      id="commitmentHash"
                      placeholder="Enter commitment hash..."
                      value={verificationForm.commitmentHash}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, commitmentHash: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="verifyValidatorId">Validator ID</Label>
                    <Input
                      id="verifyValidatorId"
                      placeholder="val_001"
                      value={verificationForm.validatorId}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, validatorId: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedThreshold">Expected Threshold</Label>
                    <Input
                      id="expectedThreshold"
                      type="number"
                      value={verificationForm.expectedThreshold}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, expectedThreshold: parseInt(e.target.value) }))}
                    />
                  </div>

                  <Button 
                    onClick={() => verifyProofMutation.mutate(verificationForm)}
                    disabled={verifyProofMutation.isPending || !verificationForm.proofHash}
                    className="w-full"
                  >
                    {verifyProofMutation.isPending ? 'Verifying...' : 'Verify Proof'}
                  </Button>
                </div>
              </div>

              {verifyProofMutation.data && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  verifyProofMutation.data.verification.isValid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    verifyProofMutation.data.verification.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Verification {verifyProofMutation.data.verification.isValid ? 'Successful' : 'Failed'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <span className="ml-2">
                        {(verifyProofMutation.data.verification.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Verification Time:</span>
                      <span className="ml-2">{verifyProofMutation.data.verification.verificationTime}ms</span>
                    </div>
                    <div>
                      <span className="font-medium">Integrity Check:</span>
                      <Badge variant={verifyProofMutation.data.integrity.isIntact ? "secondary" : "destructive"} className="ml-2">
                        {verifyProofMutation.data.integrity.isIntact ? 'Intact' : 'Compromised'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proof History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Proof Activity</CardTitle>
              <CardDescription>History of zero-knowledge proof generation and verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Sample proof history data */}
                {[
                  { id: 1, validator: 'val_001', type: 'Generated', time: '2 min ago', status: 'valid' },
                  { id: 2, validator: 'val_002', type: 'Verified', time: '5 min ago', status: 'valid' },
                  { id: 3, validator: 'val_003', type: 'Generated', time: '8 min ago', status: 'valid' },
                  { id: 4, validator: 'val_001', type: 'Verified', time: '12 min ago', status: 'invalid' },
                ].map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{entry.type} - {entry.validator}</div>
                        <div className="text-sm text-muted-foreground">{entry.time}</div>
                      </div>
                    </div>
                    <Badge variant={entry.status === 'valid' ? 'secondary' : 'destructive'}>
                      {entry.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Location Tab */}
        <TabsContent value="data-location" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  On-Chain Storage
                </CardTitle>
                <CardDescription>Public blockchain data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Proof hashes only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Cryptographic commitments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Verification metadata</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Consensus participation proofs</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Off-Chain Storage
                </CardTitle>
                <CardDescription>Encrypted private data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Encrypted biometric data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">AES-256 encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Zero-knowledge access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Secure local storage</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Architecture</CardTitle>
              <CardDescription>How EmotionalChain protects your biometric data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">1. Biometric Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    Raw biometric data is captured locally and never transmitted in plaintext
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">2. Zero-Knowledge Proof Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Cryptographic proofs are generated proving thresholds are met without revealing actual values
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium">3. On-Chain Commitment</h4>
                  <p className="text-sm text-muted-foreground">
                    Only proof hashes and commitments are stored on the public blockchain
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium">4. Off-Chain Encrypted Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Original biometric data is encrypted and stored separately from the blockchain
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}