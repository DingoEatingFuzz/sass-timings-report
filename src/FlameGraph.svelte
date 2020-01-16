<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import flameGraph from "d3-flame-graph/dist/d3-flamegraph";

  export let timing;

  let flameDiv;

  onMount(async () => {
    if (!timing) {
      console.error("timing is a required prop");
      return;
    }

    console.log(timing.tree.asFlameGraph());
    const graph = flameGraph()
      .width(1200)
      .cellHeight(20)
      .transitionDuration(500)
      .transitionEase(d3.easeCubic)
      .sort(true)
      .title(timing.name);

    d3.select(flameDiv)
      .datum(timing.tree.asFlameGraph())
      .call(graph);
  });
</script>

<div bind:this={flameDiv} />
