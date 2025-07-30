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
      {/* Outer ring representing the blockchain network */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 4"
        opacity="0.6"
      />
      
      {/* Inner hexagonal blockchain structure */}
      <polygon
        points="50,15 70,27.5 70,52.5 50,65 30,52.5 30,27.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.8"
      />
      
      {/* Central neural network/emotional core */}
      <g transform="translate(50,50)">
        {/* Central node */}
        <circle cx="0" cy="0" r="8" fill="currentColor" opacity="0.9" />
        
        {/* Neural connections */}
        <g stroke="currentColor" strokeWidth="1.5" opacity="0.7">
          <line x1="0" y1="0" x2="-15" y2="-10" />
          <line x1="0" y1="0" x2="15" y2="-10" />
          <line x1="0" y1="0" x2="-15" y2="10" />
          <line x1="0" y1="0" x2="15" y2="10" />
          <line x1="0" y1="0" x2="0" y2="-18" />
          <line x1="0" y1="0" x2="0" y2="18" />
        </g>
        
        {/* Outer neural nodes */}
        <circle cx="-15" cy="-10" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="15" cy="-10" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="-15" cy="10" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="15" cy="10" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="0" cy="-18" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="0" cy="18" r="3" fill="currentColor" opacity="0.8" />
        
        {/* Emotional pulse indicator */}
        <circle
          cx="0"
          cy="0"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.4"
        />
      </g>
      
      {/* Corner blockchain blocks */}
      <g fill="currentColor" opacity="0.6">
        <rect x="10" y="10" width="6" height="6" rx="1" />
        <rect x="84" y="10" width="6" height="6" rx="1" />
        <rect x="10" y="84" width="6" height="6" rx="1" />
        <rect x="84" y="84" width="6" height="6" rx="1" />
      </g>
      
      {/* Biometric wave pattern */}
      <path
        d="M 20 75 Q 25 70 30 75 T 40 75 T 50 75 T 60 75 T 70 75 T 80 75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}