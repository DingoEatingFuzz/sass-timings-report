import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    dataPath: "/all-data.json"
  }
});

export default app;
