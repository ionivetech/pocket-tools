import type { Result } from "../../types/tool";
import { parseCurlConverterInput, type CurlConverterInput } from "./schema";

export type CurlRequest = Readonly<{
	method: string;
	url: string;
	headers: Readonly<Record<string, string>>;
	body: string | null;
}>;

export type CurlConverterOutput = Readonly<{
	request: CurlRequest;
	fetchCode: string;
	warnings: readonly string[];
}>;

export type CurlConverterErrorCode =
	| "empty_input"
	| "not_curl"
	| "missing_url"
	| "unsupported_option";

/**
 * Base64 for the Authorization header, which must carry UTF-8 bytes.
 * `btoa` alone throws on any character above U+00FF, so a password like "pässwörd"
 * would take the whole converter down instead of producing a command.
 *
 * @example
 * base64Utf8("user:pässwörd"); // "dXNlcjpww6Rzc3fDtnJk"
 */
function base64Utf8(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

function failure(code: CurlConverterErrorCode, message: string): Result<never> {
	return { ok: false, error: { code, message } };
}

function tokenize(command: string): string[] {
	const joined = command
		.split("\n")
		.map((line) => (line.endsWith("\\") ? line.slice(0, -1) : line))
		.join(" ");
	const tokens: string[] = [];
	let current = "";
	let quote: string | null = null;
	for (const char of joined) {
		if (quote !== null) {
			if (char === quote) {
				quote = null;
			} else {
				current += char;
			}
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === " " || char === "\t") {
			if (current !== "") {
				tokens.push(current);
				current = "";
			}
		} else {
			current += char;
		}
	}
	if (current !== "") {
		tokens.push(current);
	}
	return tokens;
}

const DATA_FLAGS = new Set(["-d", "--data", "--data-raw", "--data-binary", "--data-ascii"]);
const HEADER_FLAGS = new Set(["-H", "--header"]);
const METHOD_FLAGS = new Set(["-X", "--request"]);

/**
 * Parses a common-subset curl command (method, URL, headers, data, basic
 * auth, user agent) into copy-ready `fetch` code. Anything outside the subset
 * fails with the flag named — never silently dropped.
 *
 * @example
 * ```ts
 * runCurlConverter({ command: "curl https://x.test" }).value.request.method; // "GET"
 * runCurlConverter({ command: "wget x" }).error.code; // "not_curl"
 * ```
 */
export function runCurlConverter(input: CurlConverterInput): Result<CurlConverterOutput> {
	const validated = parseCurlConverterInput(input);
	if (!validated.ok) {
		return validated;
	}
	const raw = validated.value.command.trim();
	if (raw === "") {
		return failure("empty_input", "Paste a curl command first.");
	}
	const tokens = tokenize(raw);
	if (tokens[0] !== "curl") {
		return failure("not_curl", "That does not start with curl. Paste the copied command as-is.");
	}

	let method: string | null = null;
	let url: string | null = null;
	const headers: Record<string, string> = {};
	let body: string | null = null;
	const warnings: string[] = [];

	let index = 1;
	while (index < tokens.length) {
		const token = tokens[index]!;
		if (METHOD_FLAGS.has(token)) {
			method = (tokens[index + 1] ?? "").toUpperCase();
			index += 2;
		} else if (HEADER_FLAGS.has(token)) {
			const header = tokens[index + 1] ?? "";
			const separator = header.indexOf(":");
			if (separator < 1) {
				return failure("unsupported_option", `Header "${header}" needs a Name: value shape.`);
			}
			headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
			index += 2;
		} else if (DATA_FLAGS.has(token)) {
			body = tokens[index + 1] ?? "";
			index += 2;
		} else if (token === "-u" || token === "--user") {
			const credentials = tokens[index + 1] ?? "";
			headers.Authorization = `Basic ${base64Utf8(credentials)}`;
			index += 2;
		} else if (token === "-A" || token === "--user-agent") {
			headers["User-Agent"] = tokens[index + 1] ?? "";
			index += 2;
		} else if (token === "--compressed") {
			warnings.push("Compression (--compressed) has no fetch equivalent and was skipped.");
			index += 1;
		} else if (token.startsWith("-")) {
			return failure(
				"unsupported_option",
				`"${token}" is outside the supported subset (method, URL, headers, data, basic auth).`,
			);
		} else if (url === null) {
			url = token;
			index += 1;
		} else {
			return failure("unsupported_option", `Unexpected extra value "${token}".`);
		}
	}

	if (url === null) {
		return failure("missing_url", "No URL found in the command.");
	}
	const finalMethod = method ?? (body !== null ? "POST" : "GET");

	const lines = [`const response = await fetch(${JSON.stringify(url)}, {`];
	lines.push(`  method: ${JSON.stringify(finalMethod)},`);
	const headerNames = Object.keys(headers);
	if (headerNames.length > 0) {
		lines.push("  headers: {");
		for (const name of headerNames) {
			lines.push(`    ${JSON.stringify(name)}: ${JSON.stringify(headers[name])},`);
		}
		lines.push("  },");
	}
	if (body !== null) {
		lines.push(`  body: ${JSON.stringify(body)},`);
	}
	lines.push("});");

	return {
		ok: true,
		value: {
			request: { method: finalMethod, url, headers, body },
			fetchCode: lines.join("\n"),
			warnings,
		},
	};
}
