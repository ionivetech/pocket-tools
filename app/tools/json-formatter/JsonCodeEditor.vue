<script setup lang="ts">
import type { EditorView as EditorViewType } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { jsonDiagnostics, lineColToOffset } from "./json-diagnostics";

const props = withDefaults(
	defineProps<{
		modelValue: string;
		editorLabel: string;
		testid: string;
		readonly?: boolean;
		placeholder?: string;
	}>(),
	{ readonly: false, placeholder: "" },
);

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

const root = ref<HTMLElement | null>(null);
let view: EditorViewType | null = null;
let viewClass: typeof EditorViewType | null = null;

onMounted(async () => {
	if (!root.value) {
		return;
	}
	// Dynamic imports keep CodeMirror out of SSR/prerender module evaluation:
	// nothing here runs until the component mounts in the browser.
	const {
		EditorView,
		keymap,
		lineNumbers,
		placeholder: placeholderExtension,
	} = await import("@codemirror/view");
	const { defaultKeymap, history, indentWithTab } = await import("@codemirror/commands");
	const { HighlightStyle, syntaxHighlighting } = await import("@codemirror/language");
	const { json } = await import("@codemirror/lang-json");
	const { linter, lintGutter } = await import("@codemirror/lint");
	const { tags } = await import("@lezer/highlight");

	const jsonHighlight = syntaxHighlighting(
		HighlightStyle.define([
			{ tag: tags.propertyName, color: "var(--pt-blue-strong)", fontWeight: "600" },
			{ tag: tags.string, color: "var(--pt-ink)" },
			{ tag: [tags.number, tags.bool, tags.null], color: "var(--pt-blue)" },
			{ tag: tags.punctuation, color: "var(--pt-muted)" },
		]),
	);

	const shellTheme = EditorView.theme({
		"&": {
			fontFamily: "var(--font-mono)",
			fontSize: "0.875rem",
			backgroundColor: "transparent",
		},
		".cm-content": {
			lineHeight: "1.6",
			padding: "0.75rem 0",
			caretColor: "var(--pt-blue-strong)",
		},
		".cm-gutters": {
			backgroundColor: "color-mix(in srgb, var(--pt-blue) 5%, var(--pt-surface))",
			borderRight: "1px solid var(--pt-line)",
			color: "var(--pt-muted)",
		},
		".cm-lineNumbers .cm-gutterElement": {
			minWidth: "2.5rem",
			paddingInline: "0.5rem",
		},
		"&.cm-focused": {
			outline: "none",
		},
		".cm-activeLine": {
			backgroundColor: "color-mix(in srgb, var(--pt-blue) 6%, transparent)",
		},
	});

	// One lint source: our own parser, so the squiggle matches the status bar
	// exactly. The generic jsonParseLinter stays out to avoid duplicate markers.
	const pocketLint = linter((lintView) => {
		const docText = lintView.state.doc.toString();
		return jsonDiagnostics(docText).map((diagnostic) => {
			const from = lineColToOffset(docText, diagnostic.line, diagnostic.column);
			return {
				from,
				to: Math.min(from + 1, docText.length),
				severity: "error" as const,
				message: diagnostic.message,
			};
		});
	});

	const syncModel = EditorView.updateListener.of((update) => {
		if (update.docChanged) {
			emit("update:modelValue", update.state.doc.toString());
		}
	});

	viewClass = EditorView;
	view = new EditorView({
		doc: props.modelValue,
		extensions: [
			lineNumbers(),
			json(),
			jsonHighlight,
			history(),
			keymap.of([indentWithTab, ...defaultKeymap]),
			pocketLint,
			lintGutter(),
			shellTheme,
			EditorView.editable.of(!props.readonly),
			...(props.placeholder ? [placeholderExtension(props.placeholder)] : []),
			EditorView.contentAttributes.of({
				id: props.testid,
				"data-testid": props.testid,
				"aria-label": props.editorLabel,
			}),
			syncModel,
		],
		parent: root.value,
	});
});

watch(
	() => props.modelValue,
	(next) => {
		if (!view) {
			return;
		}
		const current = view.state.doc.toString();
		if (current !== next) {
			view.dispatch({ changes: { from: 0, to: current.length, insert: next } });
		}
	},
);

onBeforeUnmount(() => {
	view?.destroy();
	view = null;
});

/**
 * Moves the cursor to a 1-based line and scrolls it into view, backing the
 * "Go to line N" action.
 *
 * @example
 * ```ts
 * editorRef.value?.focusLine(3);
 * ```
 */
function focusLine(line: number): void {
	if (!view || !viewClass) {
		return;
	}
	const docText = view.state.doc.toString();
	const pos = lineColToOffset(docText, line, 1);
	view.dispatch({
		selection: { anchor: pos },
		effects: viewClass.scrollIntoView(pos, { y: "center" }),
	});
	view.focus();
}

defineExpose({ focusLine });
</script>

<template>
	<div ref="root" class="pt-cm" data-testid="pt-code-editor" />
</template>
