import React from 'react';
// Inline the DepEd logo via Vite so there is no network fetch and html2canvas captures it reliably
// Replace the PNG at src/assets/deped-logo.png (or the current asset filename) to update the logo everywhere.
// @ts-ignore - Vite asset import type shim is provided in src/types/assets.d.ts
import logoInline from '../src/assets/deped-logo.png.png?inline';
// @ts-ignore - Vite asset import type shim is provided in src/types/assets.d.ts
import logoUrl from '../src/assets/deped-logo.png.png?url';

type Props = {
  className?: string;
  size?: number; // width/height in px if provided
  alt?: string;
};

const DepEdLogo: React.FC<Props> = ({ className, size, alt }) => {
  const wh = size ? { width: size, height: size } : {};
  const src = (typeof logoInline === 'string' && logoInline.startsWith('data:'))
    ? (logoInline as unknown as string)
    : (logoUrl as unknown as string);
  return <img src={src} alt={alt ?? 'DepEd Logo'} className={className} {...wh} />;
};

export default DepEdLogo;
