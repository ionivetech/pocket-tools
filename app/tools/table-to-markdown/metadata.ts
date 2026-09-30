import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "table-to-markdown",
	name: "Table to Markdown",
	description: "Paste spreadsheet cells, get a markdown table.",
	category: "Text",
	icon: "arrow-right",
	accent: "blue-soft",
	keywords: ["table", "csv", "markdown"],
	componentPath: "~/tools/table-to-markdown/ToolComponent.vue",
};
