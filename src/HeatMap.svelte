<script>
  import { onMount } from "svelte";
  import data from "./data";
  import FlameGraph from "./FlameGraph.svelte";
  import vegaEmbed from "vega-embed";

  let vegaDiv;
  let groups = [];
  let chartData = [];

  const countAll = gs => gs.reduce((sum, g) => sum + g.trees.length, 0);
  const median = list => {
    if (!list || list.length === 0) return 0;
    if (list.length === 1) return list[0];
    list.sort((a, b) => a - b);

    if (list.length % 2 === 1) return list[Math.floor(list.length / 2)];
    return (list[list.length / 2] + list[list.length / 2 - 1]) / 2;
  };

  const styleTimings = trees => trees.map(t => t.findStyleRoot().derivedTotal);
  const buildMatch = to => from =>
    from.product === to.product && from.build === to.build;

  const chart = data => {
    var dartGroups = data.filter(d => d.compiler === "dart");
    var libGroups = data.filter(d => d.compiler === "lib");
    return dartGroups.map(dartGroup => {
      const dartMedian = median(styleTimings(dartGroup.trees));
      const libMedian = median(
        styleTimings(libGroups.find(buildMatch(dartGroup)).trees)
      );
      return {
        product: dartGroup.product,
        build: dartGroup.build,
        dartMedian,
        libMedian,
        diff: 1 - dartMedian / libMedian
      };
    });
  };

  const unsub = data.subscribe(d => {
    groups = d.data;
    chartData = groups ? chart(groups) : [];
    console.table(chartData);
  });

  onMount(() => {
    vegaDiv &&
      vegaEmbed(vegaDiv, {
        $schema: "https://vega.github.io/schema/vega-lite/v4.json",
        description: "A simple bar chart with embedded data.",
        data: {
          values: [
            { a: "A", b: 28 },
            { a: "B", b: 55 },
            { a: "C", b: 43 },
            { a: "D", b: 91 },
            { a: "E", b: 81 },
            { a: "F", b: 53 },
            { a: "G", b: 19 },
            { a: "H", b: 87 },
            { a: "I", b: 52 }
          ]
        },
        mark: "bar",
        encoding: {
          x: { field: "a", type: "ordinal" },
          y: { field: "b", type: "quantitative" }
        }
      });
  });
</script>

{#if groups}
  <h1>
    There are {groups.length} groups, totally {countAll(groups)} records..
  </h1>
  <div bind:this={vegaDiv} />
  <!-- <FlameGraph timing={brokenRecords[0]} /> -->
  <ol>
    {#each groups as group}
      <li>
        <strong>
          {group.product} ({group.compiler} compiler) {group.build}:
        </strong>
        <ol>
          {#each group.trees as tree}
            <li>{tree.findStyleRoot().find('SassCompiler').derivedTotal}</li>
          {/each}
        </ol>
      </li>
    {/each}
  </ol>
{/if}
