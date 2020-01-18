<script>
  import { onMount } from "svelte";
  import data from "./data";
  import vegaEmbed from "vega-embed";

  export let product;
  export let build;

  let vegaDiv;
  let vegaDiv2;
  let allData;
  let chartData;

  $: {
    chartData = chart(allData || [], product, build);
    renderCharts();
  }

  const vegaFor = field => ({
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    description:
      "Distribution of build timings for a sample of builds for a product and build type.",
    data: {
      values: chartData
    },
    width: 900,
    height: 80,
    mark: {
      type: "tick"
    },
    encoding: {
      x: {
        field,
        type: "quantitative",
        format: "d",
        axis: { title: "time (ms)" }
      },
      y: {
        field: "compiler",
        type: "ordinal"
      },
      color: {
        condition: {
          test: "datum['compiler'] === 'dart'",
          value: "#994a07"
        },
        value: "#134b85"
      }
    }
  });

  const renderCharts = () => {
    vegaDiv && vegaEmbed(vegaDiv, vegaFor("timingSass"));
    vegaDiv2 && vegaEmbed(vegaDiv2, vegaFor("timingTotal"));
  };

  const chart = (data, product, build) => {
    const groups = data.filter(d => d.product === product && d.build === build);
    if (groups.length !== 2) return [];
    return flatten(groups[0]).concat(flatten(groups[1]));
  };

  const flatten = group =>
    group.trees.map(t => ({
      compiler: group.compiler,
      timingSass: t.findStyleRoot().derivedTotal / 1000000,
      timingTotal: t.root.derivedTotal / 1000000
    }));

  const unsub = data.subscribe(d => {
    allData = d.data;
  });

  onMount(() => {
    renderCharts();
  });
</script>

<div>
  {#if chartData}
    <h3>Sass Compiler Timings</h3>
    <div bind:this={vegaDiv} />
    <h3>Total Build Timings</h3>
    <div bind:this={vegaDiv2} />
  {/if}
</div>
