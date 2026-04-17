import { expect, type Locator, type Page } from '@playwright/test';

type WindowOpenCall = { url: string; target?: string; features?: string };

export class BugReportPage {
  constructor(public readonly page: Page) {}

  async installWindowOpenSpy(): Promise<void> {
    await this.page.addInitScript(() => {
      const calls: WindowOpenCall[] = [];
      (window as unknown as { __openCalls: WindowOpenCall[] }).__openCalls = calls;
      window.open = ((url?: string | URL, target?: string, features?: string) => {
        calls.push({
          url: typeof url === 'string' ? url : (url?.toString() ?? ''),
          target,
          features,
        });
        return { closed: false } as Window;
      }) as typeof window.open;
    });
  }

  async getOpenCalls(): Promise<WindowOpenCall[]> {
    return this.page.evaluate(
      () => (window as unknown as { __openCalls?: WindowOpenCall[] }).__openCalls ?? [],
    );
  }

  async clearCooldown(): Promise<void> {
    await this.page.evaluate(() => localStorage.removeItem('invgen:bugReport:v1'));
  }

  triggerButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Report a bug|Relatar bug)$/i,
    });
  }

  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  titleInput(): Locator {
    return this.page.locator('[id="bug-report.title"]');
  }

  descriptionInput(): Locator {
    return this.page.locator('[id="bug-report.description"]');
  }

  contextCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"]').first();
  }

  submitButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Open on GitHub|Abrir no GitHub)$/i,
    });
  }

  cancelButton(): Locator {
    return this.page.getByRole('button', { name: /^(Cancel|Cancelar)$/i });
  }

  cooldownStatus(): Locator {
    return this.page.getByRole('status').filter({ hasText: /Try again|Tente novamente/ });
  }

  async openDialog(): Promise<void> {
    await this.triggerButton().click();
    await expect(this.dialog()).toBeVisible({ timeout: 10_000 });
  }

  async fill(title: string, description: string): Promise<void> {
    await this.titleInput().fill(title);
    await this.descriptionInput().fill(description);
  }

  async submit(): Promise<void> {
    await this.submitButton().click();
  }
}
