import Image from 'next/image';

export function LogoM({
  size = 36,
  className = '',
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="MADANI"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}