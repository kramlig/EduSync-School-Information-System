import React from 'react';

type Props = {
  className?: string;
  size?: number; // width/height in px if provided
  alt?: string;
};

const DepEdLogo: React.FC<Props> = ({ className, size, alt }) => {
  const wh = size ? { width: size, height: size } : {};
  // Use edusync logo instead
  return <img src="/edusync-logo.png" alt={alt ?? 'EduSync Logo'} className={className} {...wh} />;
};

export default DepEdLogo;
