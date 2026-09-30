import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "datetime-helper",
	name: "Date and time helper",
	description: "Convert timestamps and see dates in plain words.",
	category: "Everyday",
	icon: "sun",
	accent: "blue-soft",
	keywords: ["date", "time", "timestamp"],
	componentPath: "~/tools/datetime-helper/ToolComponent.vue",
};
