import { cn } from '@/lib/utils';

interface MonogramProps {
  size?: number;
  className?: string;
}

export function Monogram({ size = 40, className }: MonogramProps) {
  const radius = Math.round(size * 0.21);
  const fontSize = Math.round(size * 0.46);
  return (
    <span
      aria-label="AV"
      role="img"
      className={cn(
        'bg-foreground text-background inline-flex items-center justify-center font-medium leading-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize,
        letterSpacing: '-0.06em',
      }}
    >
      A<span style={{ color: 'var(--av-gray-500)' }}>V</span>
    </span>
  );
}
