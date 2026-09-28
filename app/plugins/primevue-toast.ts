import ToastService from "primevue/toastservice";

/** Registers PrimeVue's tiny toast event bus globally; the visual `<Toast>` lives once in the default layout. */
export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(ToastService);
});
