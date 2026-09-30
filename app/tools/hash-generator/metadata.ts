import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "hash-generator",
	name: "Hash generator",
	description: "Make a SHA fingerprint for any text.",
	category: "Developer",
	icon: "code",
	accent: "blue-strong",
	keywords: ["hash", "sha", "checksum"],
	componentPath: "~/tools/hash-generator/ToolComponent.vue",
};
