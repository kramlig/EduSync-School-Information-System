import React from 'react';

type Props = {
  className?: string;
  size?: number; // width/height in px if provided
  alt?: string;
};

const DepEdLogo: React.FC<Props> = ({ className, size, alt }) => {
  const wh = size ? { width: size, height: size } : {};
  return <img src="/deped-logo.png" alt={alt ?? 'DepEd Logo'} className={className} {...wh} />;
};

export default DepEdLogo;
