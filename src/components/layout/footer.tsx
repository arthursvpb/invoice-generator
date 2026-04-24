import { BugReportButton } from '@/components/bug-report/bug-report-button';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border bg-background/60 border-t">
      <div className="text-muted-foreground mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 px-4 text-xs">
        <span className="font-mono text-[0.7rem] tracking-[0.08em] uppercase">
          © {year} Arthur Vasconcellos
        </span>
        <BugReportButton />
      </div>
    </footer>
  );
}
