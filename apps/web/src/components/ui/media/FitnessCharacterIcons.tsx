'use client';

import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface FitnessCharacterIconsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  expression?: 'dissatisfied' | 'thinking' | 'neutral';
}

export function FitnessCharacterIcons({ 
  className = '', 
  size = 'md', 
  expression = 'dissatisfied' 
}: FitnessCharacterIconsProps) {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const iconSequences = {
    dissatisfied: ['frown', 'meh', 'frown', 'meh', 'frown', 'frown'], // Frown -> Meh -> Frown -> Meh -> Determined
    thinking: ['brain', 'meh', 'brain', 'meh', 'brain', 'lightbulb'], // Brain -> Meh -> Brain -> Meh -> Brain -> Lightbulb
    neutral: ['zap', 'smile', 'zap', 'smile', 'zap', 'star'] // Zap -> Smile -> Zap -> Smile -> Zap -> Star
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // Cycle through icon sequence
      setCurrentIconIndex(prev => (prev + 1) % iconSequences[expression].length);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }, 1500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expression]);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const getCurrentIcon = () => {
    return iconSequences[expression][currentIconIndex] as any;
  };

  const getAnimationClass = () => {
    if (!isAnimating) return '';
    
    switch (expression) {
      case 'dissatisfied':
        return 'animate-bounce'; // Bouncing shows determination and energy
      case 'thinking':
        return 'animate-pulse'; // Pulsing shows thinking and analysis
      case 'neutral':
        return 'animate-pulse'; // Pulsing shows strength and confidence
      default:
        return 'animate-pulse';
    }
  };

  const getIconColor = () => {
    switch (expression) {
      case 'dissatisfied':
        return 'text-orange-500';
      case 'thinking':
        return 'text-blue-500';
      case 'neutral':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <div className={`transition-all duration-300 ${getAnimationClass()}`}>
        <Icon 
          name={getCurrentIcon()} 
          className={`${getIconColor()} ${sizeClasses[size]}`}
        />
      </div>
    </div>
  );
}
