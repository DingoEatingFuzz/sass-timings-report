<script>
  import { onMount } from "svelte";
  import data from "./data";
  import FlameGraph from "./FlameGraph.svelte";
  import vegaEmbed from "vega-embed";

  export let fieldFn;
  export let domain;

  let vegaDiv;
  let chartData = [];

  const median = list => {
    if (!list || list.length === 0) return 0;
    if (list.length === 1) return list[0];
    list.sort((a, b) => a - b);

    if (list.length % 2 === 1) return list[Math.floor(list.length / 2)];
    return (list[list.length / 2] + list[list.length / 2 - 1]) / 2;
  };

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
    chartData = d.data ? chart(d.data, trees => trees.map(fieldFn)) : [];
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
    vegaDiv && vegaEmbed(vegaDiv, vegaFor(chartData, domain));
  });
</script>

{#if chartData}
  <div bind:this={vegaDiv} />
{/if}
