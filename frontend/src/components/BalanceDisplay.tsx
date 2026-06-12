import React from 'react';
import { usePredX } from '../context/PredXContext';
import AnimatedNumber from './AnimatedNumber';

interface BalanceDisplayProps {
  value: number;
  decimals?: number;
  currency?: string;
  showIcon?: boolean;
  className?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  value,
  decimals = 2,
  currency = '', // empty by default so we don't get double ALGO
  showIcon = false,
  className = ''
}) => {
  const { isBalanceHidden, toggleBalanceVisibility } = usePredX();

  return (
    <div className={`inline-flex items-center ${className}`}>
      {isBalanceHidden ? (
        <span>****{currency ? ` ${currency}` : ''}</span>
      ) : (
        <span>
          <AnimatedNumber value={value} decimals={decimals} />
          {currency && ` ${currency}`}
        </span>
      )}
      {showIcon && (
        <button
          onClick={toggleBalanceVisibility}
          className="ml-2 text-on-surface-variant hover:text-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-base">
            {isBalanceHidden ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      )}
    </div>
  );
};

export default BalanceDisplay;