import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "cron-helper",
	name: "Cron helper",
	description: "Build a schedule and read it in plain words.",
	category: "Developer",
	icon: "moon",
	accent: "blue",
	keywords: ["cron", "schedule", "task"],
	componentPath: "~/tools/cron-helper/ToolComponent.vue",
};
