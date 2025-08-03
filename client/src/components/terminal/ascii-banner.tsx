interface AsciBannerProps {
  className?: string;
}

export default function AsciBanner({ className = "" }: AsciBannerProps) {
  return (
    <div className={`ascii-art text-terminal-cyan flex flex-col items-center justify-center w-full ${className}`}>
      <pre className="text-center leading-tight font-mono">
{`███████╗███╗   ███╗ ██████╗ ████████╗██╗ ██████╗ ███╗   ██╗ █████╗ ██╗     
██╔════╝████╗ ████║██╔═══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔══██╗██║     
█████╗  ██╔████╔██║██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████║██║     
██╔══╝  ██║╚██╔╝██║██║   ██║   ██║   ██║██║   ██║██║╚██╗██║██╔══██║██║     
███████╗██║ ╚═╝ ██║╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║██║  ██║███████╗
╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝`}
      </pre>
      
      <pre className="text-center leading-tight font-mono mt-2">
{`   ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
  ██╔════╝██║  ██║██╔══██╗██║████╗  ██║
  ██║     ███████║███████║██║██╔██╗ ██║
  ██║     ██╔══██║██╔══██║██║██║╚██╗██║
  ╚██████╗██║  ██║██║  ██║██║██║ ╚████║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`}
      </pre>
      
      <div className="text-center mt-4 text-sm space-y-1">
        <div className="text-terminal-warning font-bold">The World's First Emotion-Powered Blockchain</div>
        <div className="text-terminal-success">Version: 3.2.1 - Consensus: Proof of Emotion - Network: Production</div>
        <div className="text-terminal-cyan">Human-Centric • Energy Efficient • Biometric Validated</div>
      </div>
    </div>
  );
}
