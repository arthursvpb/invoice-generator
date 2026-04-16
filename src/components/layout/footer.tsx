import { BugReportButton } from '@/components/bug-report/bug-report-button';

export function Footer() {
  return (
    <footer className="border-border/60 bg-background/60 border-t">
      <div className="text-muted-foreground mx-auto flex h-12 max-w-5xl items-center justify-center gap-3 px-4 text-xs">
        <span>
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/arthursvpb/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Arthur Vasconcellos
          </a>
        </span>
        <span aria-hidden>·</span>
        <BugReportButton />
      </div>
    </footer>
  );
}
