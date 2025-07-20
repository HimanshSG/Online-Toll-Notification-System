import React from 'react';
import { useLocation } from 'wouter';
import logo from '@/assets/logo.png';

const Logo = ({ size = 'medium' }) => {
  const [_, setLocation] = useLocation();
  
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16',
  };
  
  return (
    <div 
      className="flex items-center cursor-pointer"
      onClick={() => setLocation('/')}
    >
      <img 
        src={logo} 
        alt="TollNotify Logo"
        className={sizeClasses[size]}
      />
      {size !== 'small' && (
        <div className="ml-2">
          <h1 className={`font-bold text-primary ${size === 'large' ? 'text-3xl' : 'text-xl'}`}>
            TollNotify
          </h1>
          <p className={`${size === 'large' ? 'text-sm' : 'text-xs'} text-muted-foreground dark:text-white`}>
          Stay Notified. Drive Hassle-Free.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;