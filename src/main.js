import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    dataPath: "/all-data.json"
    // dataPath: "https://storage.googleapis.com/mlange-files/all-data.json"
  }
});

export default app;
