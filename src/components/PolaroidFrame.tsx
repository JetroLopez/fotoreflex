
import React from 'react';

interface PolaroidFrameProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

const PolaroidFrame: React.FC<PolaroidFrameProps> = ({
  src,
  alt,
  caption,
  className = ''
}) => {
  return (
    <div className={`polaroid-frame relative ${className}`}>
      <img src={src} alt={alt} className="w-full object-cover" />
      {caption && (
        <p className="text-center text-sm font-medium text-studio-brown mt-2 font-playfair">
          {caption}
        </p>
      )}
    </div>
  );
};

export default PolaroidFrame;
