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
    <div className={`flex items-center ${gapClasses[size]} ${className} relative`}>
      {/* Logo Icon - with white background circle for contrast */}
      <div className={`${sizeClasses[size]} flex-shrink-0 transition-transform duration-200 hover:scale-110 relative z-10 bg-white rounded-full p-1 shadow-lg ring-2 ring-white/50`}>
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

      {/* Brand Text - enhanced with pencil/graphite color for notebook aesthetic */}
      {showText && (
        <div className={`font-cursive ${textSizeClasses[size]} leading-none whitespace-nowrap tracking-wide flex-shrink-0 pr-2 relative z-10`} style={{
          color: '#374151',
          textShadow: '1px 1px 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6), -0.5px -0.5px 1px rgba(0,0,0,0.2)'
        }}>
          <span className="font-extrabold">
            edusync
          </span>
          <span className="font-extrabold">
            .ph
          </span>
        </div>
      )}
    </div>
  );
};

export default EdusyncLogo;
