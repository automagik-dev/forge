import './AnimatedAnvil.css';

interface AnimatedAnvilProps {
  size?: number;
  className?: string;
}

/**
 * Animated Anvil Component
 * Shows an animated anvil with hammer strikes for loading/processing states
 */
export function AnimatedAnvil({ size = 48, className = '' }: AnimatedAnvilProps) {
  return (
    <div className={`animated-anvil-container ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="animated-anvil"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Anvil Base */}
        <rect
          x="20"
          y="60"
          width="60"
          height="25"
          rx="2"
          className="anvil-base"
          fill="currentColor"
          opacity="0.8"
        />
        
        {/* Anvil Top */}
        <rect
          x="15"
          y="55"
          width="70"
          height="8"
          rx="1"
          className="anvil-top"
          fill="currentColor"
        />
        
        {/* Hammer */}
        <g className="hammer" transform="translate(50, 30)">
          <rect
            x="-3"
            y="-15"
            width="6"
            height="30"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="-8"
            y="-20"
            width="16"
            height="10"
            rx="1"
            fill="currentColor"
          />
        </g>
        
        {/* Sparks */}
        <g className="sparks">
          <circle cx="35" cy="55" r="1" className="spark spark-1" fill="#ffb86c" />
          <circle cx="50" cy="53" r="1" className="spark spark-2" fill="#f1fa8c" />
          <circle cx="65" cy="55" r="1" className="spark spark-3" fill="#ff79c6" />
        </g>
      </svg>
      
      <div className="anvil-text">Forging...</div>
    </div>
  );
}