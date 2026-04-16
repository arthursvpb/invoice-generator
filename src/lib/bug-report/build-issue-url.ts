export const BUG_REPORT_REPO = 'arthursvpb/invoice-generator';

const ISSUE_BASE = `https://github.com/${BUG_REPORT_REPO}/issues/new`;
const TITLE_PREFIX = '[bug] ';
const UA_MAX = 200;

export type BugReportContext = {
  appVersion: string;
  locale: string;
  theme: string;
  timezone: string;
  userAgent: string;
  pathname: string;
};

export type BugReportInput = {
  title: string;
  description: string;
  context: BugReportContext | null;
};

export type IssueBodyTemplate = {
  descriptionHeading: string;
  contextHeading: string;
  contextAppVersion: string;
  contextLocale: string;
  contextTheme: string;
  contextTimezone: string;
  contextUserAgent: string;
  contextUrl: string;
  signature: string;
};

export function buildIssueBody(input: BugReportInput, template: IssueBodyTemplate): string {
  const lines: string[] = [];
  lines.push(`**${template.descriptionHeading}**`);
  lines.push(input.description.trim());
  if (input.context) {
    const c = input.context;
    lines.push('');
    lines.push(`**${template.contextHeading}**`);
    lines.push(`- ${template.contextAppVersion}: ${c.appVersion}`);
    lines.push(`- ${template.contextLocale}: ${c.locale}`);
    lines.push(`- ${template.contextTheme}: ${c.theme}`);
    lines.push(`- ${template.contextTimezone}: ${c.timezone}`);
    lines.push(`- ${template.contextUserAgent}: ${c.userAgent.slice(0, UA_MAX)}`);
    lines.push(`- ${template.contextUrl}: ${c.pathname}`);
  }
  lines.push('');
  lines.push(`_${template.signature}_`);
  return lines.join('\n');
}

export function buildIssueUrl(input: BugReportInput, template: IssueBodyTemplate): string {
  const params = new URLSearchParams({
    title: `${TITLE_PREFIX}${input.title.trim()}`,
    body: buildIssueBody(input, template),
    labels: 'bug',
  });
  return `${ISSUE_BASE}?${params.toString()}`;
}
