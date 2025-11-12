'use client';

import { useState, useEffect } from 'react';

interface ThinkingEmojiProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThinkingEmoji({ className = '', size = 'md' }: ThinkingEmojiProps) {
  const [currentEmoji, setCurrentEmoji] = useState('🤔');
  
  const emojis = ['🤔', '💭', '🧠', '🤔'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji(prev => {
        const currentIndex = emojis.indexOf(prev);
        const nextIndex = (currentIndex + 1) % emojis.length;
        return emojis[nextIndex];
      });
    }, 1500);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };
  
  return (
    <div className={`inline-block transition-all duration-500 ${sizeClasses[size]} ${className}`}>
      {currentEmoji}
    </div>
  );
}
