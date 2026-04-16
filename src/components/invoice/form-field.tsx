'use client';

import * as React from 'react';
import { get, useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function SectionCard({
  title,
  description,
  children,
  footer,
  tone = 'default',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tone?: 'default' | 'warn' | 'accent';
}) {
  return (
    <Card
      className={cn(
        'border-border/60',
        tone === 'warn' && 'border-amber-400/40 bg-amber-500/5',
        tone === 'accent' && 'border-primary/30 bg-primary/5',
      )}
    >
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
      {footer && <div className="border-border/60 border-t px-6 py-4 text-xs">{footer}</div>}
    </Card>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

export function FieldRow({
  name,
  label,
  hint,
  required,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { formState } = useFormContext();
  const error = get(formState.errors, name);
  const message = typeof error?.message === 'string' ? error.message : undefined;
  const errorId = `${name}-error`;
  const enhanced = enhanceWithError(children, Boolean(message), errorId);
  return (
    <div className={cn('space-y-1.5', className)} data-invalid={message ? 'true' : undefined}>
      <Label
        htmlFor={name}
        className={cn(
          'text-muted-foreground text-[11px] font-medium tracking-[0.1em] uppercase',
          message && 'text-destructive',
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        )}
      </Label>
      {enhanced}
      {message ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {message}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

function enhanceWithError(
  children: React.ReactNode,
  invalid: boolean,
  errorId: string,
): React.ReactNode {
  let applied = false;
  const ariaProps = {
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? errorId : undefined,
  };
  const visit = (node: React.ReactNode): React.ReactNode => {
    if (applied || !React.isValidElement(node)) return node;
    const type = node.type;
    const props = (node.props ?? {}) as Record<string, unknown>;
    const isHtmlControl =
      typeof type === 'string' && ['input', 'textarea', 'select'].includes(type);
    const isFunctionControl = typeof type === 'function' && 'id' in props;
    if (isHtmlControl || isFunctionControl) {
      applied = true;
      return React.cloneElement(node as React.ReactElement<Record<string, unknown>>, ariaProps);
    }
    if (props.children !== undefined) {
      const enhancedChildren = React.Children.map(props.children as React.ReactNode, visit);
      if (applied) {
        return React.cloneElement(
          node as React.ReactElement<{ children?: React.ReactNode }>,
          {},
          enhancedChildren,
        );
      }
    }
    return node;
  };
  return React.Children.map(children, visit);
}
