<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import flameGraph from "d3-flame-graph/dist/d3-flamegraph";

  export let timing;
  export let name;

  let flameDiv;
  let graph;

  $: {
    if (graph) {
      d3.select(flameDiv)
        .datum(timing.asFlameGraph())
        .call(graph);
    }
  }

  onMount(async () => {
    if (!timing) {
      console.error("timing is a required prop");
      return;
    }

    graph = flameGraph()
      .width(1000)
      .cellHeight(20)
      .transitionDuration(500)
      .transitionEase(d3.easeCubic)
      .sort(true);

    d3.select(flameDiv)
      .datum(timing.asFlameGraph())
      .call(graph);
  });
</script>

<h3>{name}</h3>
<div bind:this={flameDiv} />
