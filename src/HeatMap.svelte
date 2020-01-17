<script>
  import { onMount } from "svelte";
  import data from "./data";
  import FlameGraph from "./FlameGraph.svelte";
  import vegaEmbed from "vega-embed";

  let vegaDiv;
  let vegaDiv2;
  let groups = [];
  let chartDataSass = [];
  let chartDataTotal = [];

  const countAll = gs => gs.reduce((sum, g) => sum + g.trees.length, 0);
  const median = list => {
    if (!list || list.length === 0) return 0;
    if (list.length === 1) return list[0];
    list.sort((a, b) => a - b);

    if (list.length % 2 === 1) return list[Math.floor(list.length / 2)];
    return (list[list.length / 2] + list[list.length / 2 - 1]) / 2;
  };

  const styleTimings = trees => trees.map(t => t.findStyleRoot().derivedTotal);
  const totalTimings = trees => trees.map(t => t.root.derivedTotal);

  const buildMatch = to => from =>
    from.product === to.product && from.build === to.build;

  const chart = (data, fieldFn) => {
    var dartGroups = data.filter(d => d.compiler === "dart");
    var libGroups = data.filter(d => d.compiler === "lib");
    return dartGroups.map(dartGroup => {
      const dartMedian = median(fieldFn(dartGroup.trees));
      const libMedian = median(
        fieldFn(libGroups.find(buildMatch(dartGroup)).trees)
      );
      const diff = 1 - dartMedian / libMedian;
      return {
        product: dartGroup.product,
        build: dartGroup.build,
        dartMedian,
        libMedian,
        diff,
        diffLabel: `${diff > 0 ? "dart" : "lib"}, +${(
          Math.abs(diff) * 100
        ).toFixed(2)}%|Δ${(Math.abs(dartMedian - libMedian) / 1000000).toFixed(
          0
        )}ms|${(Math.min(dartMedian, libMedian) / 1000000).toFixed(0)} v. ${(
          Math.max(dartMedian, libMedian) / 1000000
        ).toFixed(0)}ms`
      };
    });
  };

  const unsub = data.subscribe(d => {
    groups = d.data;
    chartDataSass = groups ? chart(groups, styleTimings) : [];
    chartDataTotal = groups ? chart(groups, totalTimings) : [];
  });

  const vegaFor = (data, domain) => ({
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    description: "A simple bar chart with embedded data.",
    data: {
      values: data
    },
    width: 800,
    height: 350,
    encoding: {
      x: {
        field: "build",
        type: "ordinal",
        axis: { orient: "top", labelAngle: 0 }
      },
      y: { field: "product", type: "ordinal" }
    },
    layer: [
      {
        mark: "rect",
        encoding: {
          color: {
            field: "diff",
            type: "quantitative",
            scale: { scheme: "blueorange", domain: [domain * -1, domain] }
          }
        }
      },
      {
        mark: {
          type: "text",
          lineBreak: "|",
          dy: -10
        },
        encoding: {
          text: {
            field: "diffLabel",
            type: "nominal"
          },
          opacity: {
            condition: { test: "datum['diff'] > 0", value: 0 },
            value: 1
          }
        }
      },
      {
        mark: {
          type: "text",
          lineBreak: "|",
          dy: -10,
          fontWeight: "bold"
        },
        encoding: {
          text: {
            field: "diffLabel",
            type: "nominal"
          },
          opacity: {
            condition: { test: "datum['diff'] > 0", value: 1 },
            value: 0
          }
        }
      }
    ]
  });

  onMount(() => {
    vegaDiv && vegaEmbed(vegaDiv, vegaFor(chartDataSass, 7));
    vegaDiv2 && vegaEmbed(vegaDiv2, vegaFor(chartDataTotal, 2));
  });
</script>

{#if groups}
  <h1>
    There are {groups.length} groups, totally {countAll(groups)} records..
  </h1>
  <div bind:this={vegaDiv} />
  <div bind:this={vegaDiv2} />
  <!-- <FlameGraph timing={brokenRecords[0]} /> -->
  <!-- <ol>
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
  </ol> -->
{/if}
