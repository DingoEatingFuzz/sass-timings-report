import { writable } from "svelte/store";

export default writable({ isLoading: false, error: null, data: null });
