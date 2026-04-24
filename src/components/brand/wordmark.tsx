import { cn } from '@/lib/utils';

interface WordmarkProps {
  className?: string;
  ariaLabel?: string;
}

export function Wordmark({ className, ariaLabel = 'AV LABS' }: WordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-medium leading-none tracking-tight',
        className,
      )}
      aria-label={ariaLabel}
      role="img"
    >
      <span style={{ letterSpacing: '-0.04em', color: 'var(--foreground)' }}>AV</span>
      <span aria-hidden style={{ display: 'inline-block', width: '0.14em' }} />
      <span
        style={{
          fontWeight: 300,
          color: 'var(--av-gray-500)',
          letterSpacing: '-0.01em',
        }}
      >
        LABS
      </span>
    </span>
  );
}
