import { describe, expect, test } from "bun:test";
import { runCurlConverter } from "./logic";
import { parseCurlConverterInput } from "./schema";

describe("curl-converter", () => {
	test("rejects a non-string command value", () => {
		expect(parseCurlConverterInput({ command: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("converts a plain GET to fetch", () => {
		const result = runCurlConverter({ command: "curl https://x.test/users" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.request.method).toBe("GET");
		expect(result.value.fetchCode).toContain('fetch("https://x.test/users"');
	});

	test("converts POST with JSON header and body", () => {
		const result = runCurlConverter({
			command:
				'curl -X POST https://x.test/users -H "Content-Type: application/json" -d \'{"name":"Ada"}\'',
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.request.method).toBe("POST");
		expect(result.value.request.headers["Content-Type"]).toBe("application/json");
		expect(result.value.request.body).toBe('{"name":"Ada"}');
		expect(result.value.fetchCode).toContain("body:");
	});

	test("implies POST for data without -X and encodes basic auth", () => {
		const result = runCurlConverter({
			command: "curl https://x.test -u ada:secret -d hello=1",
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.request.method).toBe("POST");
		expect(result.value.request.headers.Authorization).toBe(`Basic ${btoa("ada:secret")}`);
	});

	test("names non-curl input, missing URLs and unknown flags", () => {
		expect(runCurlConverter({ command: "" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(runCurlConverter({ command: "wget https://x.test" })).toMatchObject({
			ok: false,
			error: { code: "not_curl" },
		});
		expect(runCurlConverter({ command: "curl -X GET" })).toMatchObject({
			ok: false,
			error: { code: "missing_url" },
		});
		expect(runCurlConverter({ command: "curl --retry 3 https://x.test" })).toMatchObject({
			ok: false,
			error: { code: "unsupported_option" },
		});
	});
});
