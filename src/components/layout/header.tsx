import Link from 'next/link';
import { FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/invoice/language-toggle';

export function Header() {
  return (
    <header className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/invoice"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <FileText className="size-4" aria-hidden />
          <span>Invoice Generator</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
