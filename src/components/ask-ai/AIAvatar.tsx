import Image from 'next/image';

export const AIAvatar = ({ size = 80, className = "" }: { size?: number, className?: string }) => (
  <div
    className={`relative shrink-0 flex items-center justify-center ${className}`}
    style={{ width: size, height: size }}
  >
    <Image
      src="/image.png"
      alt="FirstHome AI"
      width={size}
      height={size}
      className="object-contain mix-blend-multiply"
      unoptimized
    />
  </div>
);
