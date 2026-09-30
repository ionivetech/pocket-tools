import { describe, expect, test } from "bun:test";
import { runCaseConverter } from "./logic";
import { parseCaseConverterInput } from "./schema";

describe("case-converter", () => {
	test("rejects a non-string text value", () => {
		expect(parseCaseConverterInput({ text: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("produces all seven variants", () => {
		const result = runCaseConverter({ text: "hello world" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const values = Object.fromEntries(
			result.value.variants.map((variant) => [variant.id, variant.value]),
		);
		expect(values).toMatchObject({
			lower: "hello world",
			upper: "HELLO WORLD",
			title: "Hello World",
			sentence: "Hello world",
			camel: "helloWorld",
			snake: "hello_world",
			kebab: "hello-world",
		});
	});

	test("splits camel, snake and kebab inputs into words", () => {
		const result = runCaseConverter({ text: "helloWorld_foo-bar" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const values = Object.fromEntries(
			result.value.variants.map((variant) => [variant.id, variant.value]),
		);
		expect(values.snake).toBe("hello_world_foo_bar");
	});

	test("rejects blank input with a code", () => {
		expect(runCaseConverter({ text: "   " })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
	});
});
