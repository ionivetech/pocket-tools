import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";

const CLAIM_WINDOW_MS = 1500;
// rAF ramp instead of a busy loop: a few claims across the dialog's open
// animation, cheap and enough to beat the autofocus on a loaded machine.
const CLAIM_FRAMES = [0, 1, 2, 4, 8, 16] as const;

function closeButtonOf(dialog: HTMLElement): HTMLElement | null {
	return dialog.querySelector<HTMLElement>(".p-dialog-close-button");
}

/**
 * Moves a dialog's initial focus to its primary control when the dialog opens.
 *
 * PrimeVue focuses its own close button on open, and it can do so *after* the
 * dialog transition — which is why a one-shot focus call is not enough. This
 * composes two cheap strategies: a short rAF ramp while the dialog settles, and
 * a `focusin` safety net for the whole window.
 *
 * The safety net only re-claims when the browser focus sits on PrimeVue's close
 * button. If the user has moved focus anywhere else in the dialog (Tab, click),
 * the helper stands down and never fights them.
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
	let frameHandles: number[] = [];
	let windowTimer: ReturnType<typeof setTimeout> | undefined;
	let detach: (() => void) | undefined;

	function release(): void {
		for (const handle of frameHandles) {
			cancelAnimationFrame(handle);
		}
		frameHandles = [];
		if (windowTimer !== undefined) {
			clearTimeout(windowTimer);
			windowTimer = undefined;
		}
		detach?.();
		detach = undefined;
	}

	function claim(force: boolean): void {
		if (typeof document === "undefined") {
			return;
		}
		const dialog = document.querySelector<HTMLElement>(`[data-testid="${dialogTestId}"]`);
		const target = dialog?.querySelector<HTMLElement>("[data-autofocus-target]");
		if (!dialog || !target) {
			return;
		}
		const active = document.activeElement;
		const stolenByDialog =
			active === closeButtonOf(dialog) || active === null || active === document.body;
		if (document.activeElement === target) {
			return;
		}
		if (force || stolenByDialog) {
			target.focus();
		}
	}

	function begin(): void {
		release();
		void nextTick().then(() => claim(true));
		let delay = 0;
		for (const step of CLAIM_FRAMES) {
			delay = step;
			frameHandles.push(
				requestAnimationFrame(() => {
					if (delay === 0) {
						return;
					}
					// Nested rAF: one frame for the paint, one for the trap.
					frameHandles.push(
						requestAnimationFrame(() => {
							claim(true);
						}),
					);
				}),
			);
		}

		const onFocusIn = (event: FocusEvent): void => {
			const dialog = document.querySelector<HTMLElement>(`[data-testid="${dialogTestId}"]`);
			if (!dialog) {
				return;
			}
			claim(event.target === closeButtonOf(dialog));
		};
		document.addEventListener("focusin", onFocusIn, true);
		detach = () => {
			document.removeEventListener("focusin", onFocusIn, true);
		};
		windowTimer = setTimeout(release, CLAIM_WINDOW_MS);
	}

	watch(
		open,
		(value) => {
			if (value) {
				begin();
			} else {
				release();
			}
		},
		// Dialogs mounted conditionally (`v-if`) are born open: the watcher must
		// also fire for the initial value, not only for later transitions.
		{ immediate: true },
	);

	onBeforeUnmount(release);
}
