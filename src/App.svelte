<script>
  import { onMount } from "svelte";
  import data from "./data";
  import HeatMap from "./HeatMap.svelte";

  export let dataPath;

  let dataRequest = {};

  const unsub = data.subscribe(d => {
    dataRequest = d;
  });

  onMount(async () => {
    data.update(d => {
      d.isLoading = true;
      return d;
    });

    try {
      const res = await fetch(dataPath);
      const json = await res.json();
      data.update(d => {
        d.data = json;
        d.isLoading = false;
        return d;
      });
    } catch (err) {
      data.update(d => {
        d.error = error;
        d.isLoading = false;
        return d;
      });
    }
  });
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  {#if dataRequest.isLoading}
    <h1>Loading all the data...</h1>
  {:else if dataRequest.error}
    <h1>Uh oh... {dataRequest.error}</h1>
  {:else}
    <HeatMap />
  {/if}
</main>
