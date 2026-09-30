import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "unit-converter",
	name: "Unit converter",
	description: "Convert length, weight, temperature and more.",
	category: "Everyday",
	icon: "refresh",
	accent: "blue",
	keywords: ["units", "convert", "measure"],
	componentPath: "~/tools/unit-converter/ToolComponent.vue",
};
