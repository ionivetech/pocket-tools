export type LocalErrorPhase = "load" | "render";

type LocalErrorCode = "tool_component_load_failed" | "tool_component_render_failed";

type LocalErrorContext = {
	phase: LocalErrorPhase;
	toolSlug: string;
};

const localErrorDetails: Record<LocalErrorPhase, { code: LocalErrorCode; message: string }> = {
	load: {
		code: "tool_component_load_failed",
		message: "A tool component could not be loaded.",
	},
	render: {
		code: "tool_component_render_failed",
		message: "A tool component could not be displayed.",
	},
};

/**
 * Reports a local tool failure without exposing user values or throwing.
 *
 * @example
 * reportLocalError(error, { phase: "load", toolSlug: "json-formatter" });
 */
export function reportLocalError(error: unknown, context: LocalErrorContext): void {
	void error;

	try {
		if (import.meta.env.DEV !== true && process.env.NODE_ENV !== "development") {
			return;
		}

		const details = localErrorDetails[context.phase];
		console.error("[PocketTools]", details.code, details.message);
	} catch {
		return;
	}
}
