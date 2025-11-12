'use client';

import { FitnessCharacterIcons } from './FitnessCharacterIcons';

interface FitnessCharacterProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  expression?: 'dissatisfied' | 'thinking' | 'neutral';
}

export function FitnessCharacter({ 
  className = '', 
  size = 'md', 
  expression = 'dissatisfied' 
}: FitnessCharacterProps) {
  return (
    <FitnessCharacterIcons 
      className={className}
      size={size}
      expression={expression}
    />
  );
}
