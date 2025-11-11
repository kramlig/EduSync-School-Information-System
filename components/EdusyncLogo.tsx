import React from 'react';

interface EdusyncLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

/**
 * EduSync Logo Component
 * 
 * Displays the EduSync brand logo with optional text.
 * Uses the signature blue-to-purple gradient that matches the landing page design.
 * Optimized for UI/UX best practices with proper spacing and typography.
 * 
 * @param className - Additional CSS classes
 * @param size - Logo size preset (sm, md, lg, xl)
 * @param showText - Whether to show "Edusync.ph" text alongside the logo
 */
const EdusyncLogo: React.FC<EdusyncLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  // Icon sizes - optimized for visual balance
  const sizeClasses = {
    sm: 'w-7 h-7',      // 28px - compact for tight spaces
    md: 'w-10 h-10',    // 40px - standard navigation
    lg: 'w-14 h-14',    // 56px - prominent headers
    xl: 'w-20 h-20'     // 80px - hero sections
  };

  // Text sizes - follows typography scale for readability
  const textSizeClasses = {
    sm: 'text-lg',          // 18px - minimum readable size
    md: 'text-[2.5rem]',    // 40px - navigation standard (prominent)
    lg: 'text-4xl',         // 36px - section headers
    xl: 'text-6xl'          // 60px - hero sections
  };

  // Gap spacing - proportional to logo size
  const gapClasses = {
    sm: 'gap-2',        // 8px
    md: 'gap-3',        // 12px
    lg: 'gap-4',        // 16px
    xl: 'gap-5'         // 20px
  };

  return (
    <div className={`flex items-center ${gapClasses[size]} ${className}`}>
      {/* Logo Icon - with subtle hover effect */}
      <div className={`${sizeClasses[size]} flex-shrink-0 transition-transform duration-200 hover:scale-105`}>
        <img 
          src="/edusync-logo.png" 
          alt="EduSync Logo" 
          className="w-full h-full object-contain drop-shadow-sm"
          onError={(e) => {
            // Fallback to gradient circle with 'e' if image fails to load
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-full flex items-center justify-center shadow-md">
                  <span class="text-white font-bold" style="font-size: ${size === 'sm' ? '0.875rem' : size === 'md' ? '1.25rem' : size === 'lg' ? '1.75rem' : '2.5rem'}">e</span>
                </div>
              `;
            }
          }}
        />
      </div>

      {/* Brand Text - with improved typography */}
      {showText && (
        <div className={`font-cursive ${textSizeClasses[size]} leading-none whitespace-nowrap tracking-tight flex-shrink-0 pr-2`}>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
            Edusync
          </span>
          <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
            .ph
          </span>
        </div>
      )}
    </div>
  );
};

export default EdusyncLogo;
