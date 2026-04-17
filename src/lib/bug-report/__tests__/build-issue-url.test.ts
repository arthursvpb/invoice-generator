import { describe, expect, it } from 'vitest';
import {
  buildIssueBody,
  buildIssueUrl,
  BUG_REPORT_REPO,
  type IssueBodyTemplate,
} from '../build-issue-url';

const template: IssueBodyTemplate = {
  descriptionHeading: 'Description',
  contextHeading: 'Technical context',
  contextAppVersion: 'App version',
  contextLocale: 'Locale',
  contextTheme: 'Theme',
  contextTimezone: 'Timezone',
  contextUserAgent: 'User agent',
  contextUrl: 'URL',
  signature: 'Reported via the Invoice Generator.',
};

const baseContext = {
  appVersion: '1.1.0',
  locale: 'pt-BR',
  theme: 'dark',
  timezone: 'America/Sao_Paulo',
  userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit',
  pathname: '/invoice',
};

describe('buildIssueBody', () => {
  it('renders description plus context when provided', () => {
    const body = buildIssueBody(
      { title: 'FX broke', description: 'Rate did not refresh.', context: baseContext },
      template,
    );
    expect(body).toContain('**Description**');
    expect(body).toContain('Rate did not refresh.');
    expect(body).toContain('**Technical context**');
    expect(body).toContain('- App version: 1.1.0');
    expect(body).toContain('- Locale: pt-BR');
    expect(body).toContain('- URL: /invoice');
    expect(body).toContain('_Reported via the Invoice Generator._');
  });

  it('omits the technical-context block when context is null', () => {
    const body = buildIssueBody(
      { title: 'FX broke', description: 'Rate did not refresh.', context: null },
      template,
    );
    expect(body).toContain('Rate did not refresh.');
    expect(body).not.toContain('**Technical context**');
    expect(body).not.toContain('App version');
  });

  it('truncates very long user agents to 200 characters', () => {
    const longUa = 'A'.repeat(500);
    const body = buildIssueBody(
      { title: 't', description: 'd', context: { ...baseContext, userAgent: longUa } },
      template,
    );
    const uaLine = body.split('\n').find((l) => l.startsWith('- User agent:')) ?? '';
    const value = uaLine.replace('- User agent: ', '');
    expect(value.length).toBe(200);
  });

  it('trims surrounding whitespace from the description', () => {
    const body = buildIssueBody(
      { title: 't', description: '   spaced   ', context: null },
      template,
    );
    expect(body).toContain('\nspaced\n');
  });
});

describe('buildIssueUrl', () => {
  it('points at the configured repo', () => {
    const url = buildIssueUrl(
      { title: 'small', description: 'a description', context: null },
      template,
    );
    expect(url).toMatch(new RegExp(`^https://github.com/${BUG_REPORT_REPO}/issues/new\\?`));
  });

  it('prepends [bug] to the title and labels the issue bug', () => {
    const url = buildIssueUrl(
      { title: 'Form crash', description: 'crashes when X', context: null },
      template,
    );
    const params = new URL(url).searchParams;
    expect(params.get('title')).toBe('[bug] Form crash');
    expect(params.get('labels')).toBe('bug');
  });

  it('encodes special characters safely', () => {
    const url = buildIssueUrl(
      {
        title: 'Café & Co — issue #1',
        description: 'A description with & ampersand and emoji 🚧',
        context: null,
      },
      template,
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe('[bug] Café & Co — issue #1');
    expect(parsed.searchParams.get('body')).toContain('& ampersand');
    expect(parsed.searchParams.get('body')).toContain('🚧');
  });

  it('round-trips the body through URLSearchParams', () => {
    const url = buildIssueUrl(
      { title: 't', description: 'line1\nline2\nline3', context: null },
      template,
    );
    const body = new URL(url).searchParams.get('body') ?? '';
    expect(body).toContain('line1');
    expect(body).toContain('line3');
    expect(body.split('\n').length).toBeGreaterThan(2);
  });
});
