<script>
  import { onMount } from "svelte";
  import TimingTree from "./timing-tree";
  import data from "./data";
  import HeatMap from "./HeatMap.svelte";

  export let dataPath;

  let dataRequest = {};

  const unsub = data.subscribe(d => {
    dataRequest = d;
  });

  const group = records => {
    const groups = {};
    records.forEach(record => {
      const [, product, compiler, build] = record.name.match(
        /(.+)-([dl].+?)-(.+)-\d\.json$/
      );
      const groupName = `${product}-${compiler}-${build}`;
      groups[groupName] = groups[groupName] || {
        product,
        compiler,
        build,
        trees: []
      };
      groups[groupName].trees.push(record.tree);
    });
    return Object.keys(groups).map(name => ({
      name,
      ...groups[name]
    }));
  };

  onMount(async () => {
    data.update(d => {
      d.isLoading = true;
      return d;
    });

    try {
      const res = await fetch(dataPath);
      const json = await res.json();
      data.update(d => {
        d.data = group(
          json.map(timing => ({
            name: timing.name,
            tree: new TimingTree(timing.value)
          }))
        );
        d.isLoading = false;
        return d;
      });
    } catch (err) {
      data.update(d => {
        d.error = err;
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
