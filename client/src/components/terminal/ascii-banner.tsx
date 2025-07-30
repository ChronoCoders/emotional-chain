interface AsciBannerProps {
  className?: string;
}

export default function AsciBanner({ className = "" }: AsciBannerProps) {
  return (
    <div className={`ascii-art text-terminal-cyan text-center ${className}`}>
      {`███████╗███╗   ███╗ ██████╗ ████████╗██╗ ██████╗ ███╗   ██╗ █████╗ ██╗     
██╔════╝████╗ ████║██╔═══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔══██╗██║     
█████╗  ██╔████╔██║██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████║██║     
██╔══╝  ██║╚██╔╝██║██║   ██║   ██║   ██║██║   ██║██║╚██╗██║██╔══██║██║     
███████╗██║ ╚═╝ ██║╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║██║  ██║███████╗
╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                                                                           
    ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
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
