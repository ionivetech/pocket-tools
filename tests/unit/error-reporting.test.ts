import { afterEach, describe, expect, test } from "bun:test";
import { reportLocalError } from "../../app/utils/error-reporting";

const originalConsoleError = console.error;
const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnvironment(value: string | undefined): void {
	if (value === undefined) {
		delete process.env.NODE_ENV;
		return;
	}

	process.env.NODE_ENV = value;
}

function captureConsoleError(run: () => void): unknown[][] {
	const calls: unknown[][] = [];
	console.error = (...args: unknown[]) => {
		calls.push(args);
	};

	try {
		run();
	} finally {
		console.error = originalConsoleError;
	}

	return calls;
}

afterEach(() => {
	console.error = originalConsoleError;
	setNodeEnvironment(originalNodeEnv);
});

describe("reportLocalError", () => {
	test("reports loader failures with a stable code in development", () => {
		setNodeEnvironment("development");
		const calls = captureConsoleError(() => {
			reportLocalError(new Error("private user value"), {
				phase: "load",
				toolSlug: "json-formatter",
			});
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]).toContain("tool_component_load_failed");
	});

	test("reports render failures with a stable code in development", () => {
		setNodeEnvironment("development");
		const calls = captureConsoleError(() => {
			reportLocalError("private user value", {
				phase: "render",
				toolSlug: "text-cleaner",
			});
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]).toContain("tool_component_render_failed");
	});

	test("accepts unknown errors without reading or serializing them", () => {
		setNodeEnvironment("development");
		const unsafeError = new Proxy(
			{},
			{
				get() {
					throw new Error("private user value");
				},
			},
		);
		const context = {
			phase: "render" as const,
			toolSlug: "color-picker",
			privateContext: "private context value",
		};
		const calls = captureConsoleError(() => reportLocalError(unsafeError, context));
		const visibleValues = calls.flat().map(String);

		expect(visibleValues).not.toContain("private user value");
		expect(visibleValues).not.toContain("private context value");
		expect(calls.flat().some((value) => typeof value === "object")).toBe(false);
	});

	test("does not log in production", () => {
		setNodeEnvironment("production");
		const calls = captureConsoleError(() => {
			reportLocalError(new Error("private user value"), {
				phase: "load",
				toolSlug: "password-generator",
			});
		});

		expect(calls).toHaveLength(0);
	});

	test("never throws when development logging fails", () => {
		setNodeEnvironment("development");
		console.error = () => {
			throw new Error("logging failed");
		};

		expect(() => {
			reportLocalError(new Error("private user value"), {
				phase: "render",
				toolSlug: "text-cleaner",
			});
		}).not.toThrow();
	});
});
