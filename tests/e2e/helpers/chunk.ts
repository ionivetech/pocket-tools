import type { BrowserContext, Route } from "@playwright/test";

const lazyChunkGlob = "**/_nuxt/*.js";

export interface CapturedChunk {
	status: number;
	headers: Record<string, string>;
	body: string;
}

export interface ChunkGate {
	/** Resolves once a matching chunk is held, or once the bounded wait elapses. */
	intercepted: Promise<void>;
	/** Resolves once the held chunk may continue. */
	opened: Promise<void>;
	/** Lets the held chunk continue. Idempotent. */
	release: () => void;
	/** Records that a matching chunk is now held; call it first inside the handler. */
	markIntercepted: () => void;
}

/**
 * Bounded one-shot gate for holding a lazy chunk request. It opens on `release()` or after
 * `timeoutMs`, so a chunk that never arrives fails an assertion instead of hanging the test.
 * @example `const gate = createChunkGate(10_000);`
 */
export function createChunkGate(timeoutMs = 10_000): ChunkGate {
	let open = () => {};
	const opened = new Promise<void>((resolve) => {
		open = resolve;
	});
	let markIntercepted = () => {};
	const intercepted = new Promise<void>((resolve) => {
		markIntercepted = resolve;
	});
	const timer = setTimeout(() => {
		open();
		markIntercepted();
	}, timeoutMs);

	return {
		intercepted,
		opened,
		markIntercepted,
		release: () => {
			clearTimeout(timer);
			open();
		},
	};
}

/**
 * Intercepts Nuxt lazy chunks and hands matching ones to `onMarkerChunk`. `route.fetch()` disposes
 * its response once the body is read, so status, headers, and body are captured first and the route
 * is fulfilled from those values. A request that is superseded or torn down with the test is
 * ignored instead of failing the run.
 * @example `interceptLazyChunk(context, "not available yet", async (chunk, route) => route.fulfill(chunk));`
 */
export function interceptLazyChunk(
	context: BrowserContext,
	marker: string,
	onMarkerChunk: (chunk: CapturedChunk, route: Route) => Promise<unknown>,
) {
	context.route(lazyChunkGlob, async (route) => {
		try {
			const response = await route.fetch({ timeout: 15_000 });
			const chunk: CapturedChunk = {
				status: response.status(),
				// The decoded body no longer matches a compressed encoding or its original length.
				headers: Object.fromEntries(
					Object.entries(response.headers()).filter(
						([name]) => name !== "content-encoding" && name !== "content-length",
					),
				),
				body: await response.text(),
			};

			if (chunk.body.includes(marker)) await onMarkerChunk(chunk, route);
			else await route.fulfill(chunk);
		} catch {
			// Superseded by a new navigation, or the context closed with the test.
			// Abort anyway, so a real fetch failure cannot leave the chunk hanging.
			await route.abort().catch(() => {});
		}
	});
}
