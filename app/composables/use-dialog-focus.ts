import { nextTick, watch, type Ref } from "vue";

const FOCUS_CLAIM_BUDGET_MS = 500;

/**
 * Moves a dialog's initial focus to its primary control when the dialog opens.
 *
 * PrimeVue Dialog autofocuses its own close button on open, so this re-claims
 * focus after paint with a bounded retry instead of fighting the focus trap:
 * poll for `[data-autofocus-target]` inside the dialog, focus it, and stop as
 * soon as it holds `document.activeElement`. Never throws, never leaves the
 * trap, and no-ops during SSR (no `document`).
 *
 * DOM-only by nature: covered by Playwright (`tests/e2e/dialog-focus.pw.ts`),
 * not by `bun test` (see the coverage-gate allowlist entry).
 *
 * @example
 * ```ts
 * useDialogFocus(open, "home-palette"); // focuses the palette search input
 * ```
 */
export function useDialogFocus(open: Ref<boolean>, dialogTestId: string): void {
	async function claimFocus(): Promise<void> {
		if (typeof document === "undefined") {
			return;
		}
		const started = Date.now();
		let target: HTMLElement | null = null;
		while (Date.now() - started < FOCUS_CLAIM_BUDGET_MS) {
			await nextTick();
			target = document.querySelector<HTMLElement>(
				`[data-testid="${dialogTestId}"] [data-autofocus-target]`,
			);
			if (target === null) {
				await new Promise((resolve) => requestAnimationFrame(resolve));
				continue;
			}
			target.focus();
			if (document.activeElement === target) {
				return;
			}
			await new Promise((resolve) => requestAnimationFrame(resolve));
		}
		target?.focus();
	}

	watch(
		open,
		(value) => {
			if (value) {
				void claimFocus();
			}
		},
		// Dialogs mounted conditionally (`v-if`) are born open: the watcher must
		// also fire for the initial value, not only for later transitions.
		{ immediate: true },
	);
}
