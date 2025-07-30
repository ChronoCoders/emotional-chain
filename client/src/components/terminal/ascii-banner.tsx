import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

interface AsciBannerProps {
  className?: string;
}

export default function AsciBanner({ className = "" }: AsciBannerProps) {
  return (
    <div className={`ascii-art text-terminal-cyan text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <EmotionalChainLogo size={64} className="text-terminal-cyan" />
      </div>
      {`███████╗███╗   ███╗ ██████╗ ████████╗██╗ ██████╗ ███╗   ██╗ █████╗ ██╗      
██╔════╝████╗ ████║██╔═══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔══██╗██║      
█████╗  ██╔████╔██║██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████║██║      
██╔══╝  ██║╚██╔╝██║██║   ██║   ██║   ██║██║   ██║██║╚██╗██║██╔══██║██║      
███████╗██║ ╚═╝ ██║╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║██║  ██║███████╗
╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                                                                            
██████╗ ██╗  ██╗ █████╗ ██╗███╗   ██╗
██╔════╝██║  ██║██╔══██╗██║████╗  ██║
██║     ███████║███████║██║██╔██╗ ██║
██║     ██╔══██║██╔══██║██║██║╚██╗██║
╚██████╗██║  ██║██║  ██║██║██║ ╚████║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                                            
The World's First Emotion-Powered Blockchain
Version: 1.0.0 - Consensus: Proof of Emotion - Network: Custom
Human-Centric - Energy Efficient - Biometric Validated`}
    </div>
  );
}
