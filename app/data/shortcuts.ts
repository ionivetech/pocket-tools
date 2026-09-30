export type Shortcut = Readonly<{
	id: string;
	keys: string;
	label: string;
	hint: string;
}>;

/**
 * Central keyboard-shortcut registry. Global keys ignore typing contexts
 * except Esc and Ctrl/⌘+K; sequence keys (`g h`) are handled by the layout.
 *
 * @example
 * ```ts
 * shortcuts.find((s) => s.id === "palette"); // { keys: "Ctrl+K", ... }
 * ```
 */
export const shortcuts: readonly Shortcut[] = [
	{ id: "palette", keys: "Ctrl+K", label: "Open quick search", hint: "Works on every page" },
	{ id: "search", keys: "/", label: "Focus search", hint: "Jump to the page search" },
	{ id: "help", keys: "?", label: "Show shortcuts", hint: "This help" },
	{ id: "home", keys: "G then H", label: "Go home", hint: "Back to the start" },
	{ id: "library", keys: "G then T", label: "Open tool library", hint: "Browse every tool" },
	{ id: "close", keys: "Esc", label: "Close dialog", hint: "Back to what you were doing" },
];
