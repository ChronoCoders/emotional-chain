interface EmotionalChainLogoProps {
  size?: number;
  className?: string;
}

export default function EmotionalChainLogo({ size = 48, className = "" }: EmotionalChainLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rounded square background */}
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="20"
        ry="20"
        fill="currentColor"
        opacity="0.1"
        className="fill-black dark:fill-white"
      />
      
      {/* Medical cross symbol with 8 arms */}
      <g transform="translate(50,50)" fill="currentColor">
        {/* Main horizontal arm */}
        <rect x="-20" y="-4" width="40" height="8" rx="4" />
        
        {/* Main vertical arm */}
        <rect x="-4" y="-20" width="8" height="40" rx="4" />
        
        {/* Diagonal arms - top-left to bottom-right */}
        <rect 
          x="-14.14" 
          y="-4" 
          width="28.28" 
          height="8" 
          rx="4" 
          transform="rotate(45)"
        />
        
        {/* Diagonal arms - top-right to bottom-left */}
        <rect 
          x="-14.14" 
          y="-4" 
          width="28.28" 
          height="8" 
          rx="4" 
          transform="rotate(-45)"
        />
        
        {/* Central circle */}
        <circle cx="0" cy="0" r="6" fill="currentColor" />
        
        {/* Small accent dots at arm ends */}
        <circle cx="18" cy="0" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="-18" cy="0" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="0" cy="18" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="0" cy="-18" r="2" fill="currentColor" opacity="0.8" />
        
        {/* Diagonal accent dots */}
        <circle cx="12.7" cy="12.7" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="-12.7" cy="12.7" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="12.7" cy="-12.7" r="2" fill="currentColor" opacity="0.8" />
        <circle cx="-12.7" cy="-12.7" r="2" fill="currentColor" opacity="0.8" />
      </g>
      
      {/* Subtle heartbeat line */}
      <path
        d="M 15 80 L 25 80 L 30 70 L 35 90 L 40 60 L 45 85 L 50 80 L 55 75 L 60 90 L 65 60 L 70 85 L 75 80 L 85 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
    </svg>
  );
}