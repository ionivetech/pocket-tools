import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "curl-converter",
	name: "cURL converter",
	description: "Turn a curl command into copy-ready fetch code.",
	category: "Developer",
	icon: "arrow-up-right",
	accent: "blue-strong",
	keywords: ["curl", "fetch", "api"],
	componentPath: "~/tools/curl-converter/ToolComponent.vue",
};
