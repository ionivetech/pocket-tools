import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "regex-tester",
	name: "Regex tester",
	description: "Try a search pattern and see every match live.",
	category: "Developer",
	icon: "search",
	accent: "blue-soft",
	keywords: ["regex", "pattern", "match"],
	componentPath: "~/tools/regex-tester/ToolComponent.vue",
};
