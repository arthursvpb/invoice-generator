'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';

const BugReportDialog = dynamic(
  () => import('./bug-report-dialog').then((m) => m.BugReportDialog),
  { ssr: false },
);

export function BugReportButton() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <Bug className="size-3.5" aria-hidden />
        {t.bugReport.trigger}
      </Button>
      <BugReportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
