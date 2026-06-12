import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (val: number) => string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const easeOutQuint = (x: number): number => {
  return 1 - Math.pow(1 - x, 5);
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1500,
  format,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const isAnimating = useRef(false);
  const targetValue = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Check if the target actually changed
    if (value === targetValue.current && displayValue === value) return;
    targetValue.current = value;
    
    // Start animation
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const change = endValue - startValue;
    
    if (change === 0) return;
    
    isAnimating.current = true;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      const progressRatio = Math.min(progress / duration, 1);
      const easedProgress = easeOutQuint(progressRatio);
      
      setDisplayValue(startValue + change * easedProgress);

      if (progressRatio < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        isAnimating.current = false;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedText = format
    ? format(displayValue)
    : `${prefix}${displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

  return <span className={className}>{formattedText}</span>;
};

export default AnimatedNumber;
