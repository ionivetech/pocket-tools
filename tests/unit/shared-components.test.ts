import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";

const componentsRoot = resolve(import.meta.dir, "../../app/components");
const browserActionsModule = "~/utils/browser-actions";

/**
 * What each component is expected to expose at the top level, read off its
 * `script setup` block. A rename or a dropped binding fails here, which is the
 * point: nothing else asserts these files are coherent.
 */
const expectedBindings = {
	"ToolActions.vue": [
		"props",
		"emit",
		"copyPending",
		"status",
		"statusState",
		"clearStatus",
		"reportError",
		"handleCopy",
		"handleDownload",
	],
	"ToolDualPane.vue": ["sectionId", "inputHeadingId", "outputHeadingId"],
	"ToolFileDrop.vue": [
		"props",
		"emit",
		"componentId",
		"inputId",
		"helpId",
		"fileInput",
		"isDragging",
		"status",
		"acceptRules",
		"isAccepted",
		"selectFiles",
		"openFilePicker",
		"handleInputChange",
		"handleDrop",
	],
} as const satisfies Record<string, readonly string[]>;

const componentNames = Object.keys(expectedBindings);

/**
 * This is a compile and contract check, **not** render coverage. It parses each
 * SFC, compiles the script and the template, and checks the top-level bindings.
 * No component is mounted: there is no component-rendering runner here, and none
 * of the three is rendered by a route or a browser test. It catches a syntax
 * error, a broken template, or a renamed binding — it does not catch a
 * component that compiles and then behaves wrongly.
 */
describe("shared tool components compile and expose the expected contract", () => {
	test.each(componentNames)("%s parses and compiles with no errors", async (name) => {
		const source = await readFile(resolve(componentsRoot, name), "utf8");
		const { descriptor, errors } = parse(source, { filename: name });
		expect(errors).toEqual([]);

		const script = compileScript(descriptor, { id: name });
		expect(script.bindings).toBeDefined();

		const template = compileTemplate({
			source: descriptor.template?.content ?? "",
			filename: name,
			id: name,
		});
		expect(template.errors).toEqual([]);
	});

	test.each(componentNames)("%s exposes its expected top-level bindings", async (name) => {
		const source = await readFile(resolve(componentsRoot, name), "utf8");
		const { descriptor } = parse(source, { filename: name });
		const bindings = compileScript(descriptor, { id: name }).bindings ?? {};

		const missing = expectedBindings[name as keyof typeof expectedBindings].filter(
			(binding) => !(binding in bindings),
		);
		expect(missing).toEqual([]);
	});

	test("ToolActions.vue is the component that consumes the tested browser actions", async () => {
		const source = await readFile(resolve(componentsRoot, "ToolActions.vue"), "utf8");
		const script = compileScript(parse(source, { filename: "ToolActions.vue" }).descriptor, {
			id: "ToolActions.vue",
		}).content;

		// The imports that tie the untested component to the tested logic, and the
		// calls that prove it uses them rather than reimplementing them.
		expect(script).toContain(browserActionsModule);
		for (const symbol of ["BrowserActionError", "copyText", "downloadText"]) {
			expect(script).toMatch(new RegExp(`import[^;]*\\b${symbol}\\b[^;]*${browserActionsModule}`));
		}
		expect(script).toMatch(/\bawait copyText\(/);
		expect(script).toMatch(/\bdownloadText\(/);
	});
});
