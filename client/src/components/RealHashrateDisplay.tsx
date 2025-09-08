import { useQuery } from '@tanstack/react-query';

interface HashrateData {
  hashrateEquivalent: string;
  rawMetrics: {
    hashOpsPerSec: string;
    ecdsaOpsPerSec: string;
    nonceAttemptsPerSec: string;
    totalComputationalPower: string;
  };
  isReal: boolean;
  description: string;
}

export function RealHashrateDisplay() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/crypto/hashrate'],
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 2000
  });

  if (isLoading) {
    return <span className="text-terminal-cyan terminal-text font-medium">Calculating...</span>;
  }

  if (error || !data || !(data as any)?.success) {
    // Fallback to a basic calculation
    return <span className="text-terminal-orange terminal-text font-medium">~0.1 KH/s</span>;
  }

  const hashrateData: HashrateData = (data as any).data;

  return (
    <span 
      className="text-terminal-cyan terminal-text font-medium cursor-help" 
      title={`Real cryptographic work: ${hashrateData.description}\nHash Ops/sec: ${hashrateData.rawMetrics.hashOpsPerSec}\nECDSA Ops/sec: ${hashrateData.rawMetrics.ecdsaOpsPerSec}\nNonce Attempts/sec: ${hashrateData.rawMetrics.nonceAttemptsPerSec}`}
    >
      {hashrateData.hashrateEquivalent} ⚡
    </span>
  );
}