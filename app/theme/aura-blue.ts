import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/** Aura with one blue accent family, shared by light and dark mode. */
export const AuraBlue = definePreset(Aura, {
	semantic: {
		primary: {
			50: "{blue.50}",
			100: "{blue.100}",
			200: "{blue.200}",
			300: "{blue.300}",
			400: "{blue.400}",
			500: "{blue.700}",
			600: "{blue.800}",
			700: "{blue.900}",
			800: "{blue.800}",
			900: "{blue.900}",
			950: "{blue.950}",
			color: "{blue.700}",
			contrastColor: "{blue.50}",
			hoverColor: "{blue.800}",
			activeColor: "{blue.900}",
		},
		focusRing: {
			color: "{primary.color}",
		},
	},
});
