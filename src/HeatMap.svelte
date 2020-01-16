<script>
  import data from "./data";
  import FlameGraph from "./FlameGraph.svelte";

  let groups = [];

  const countAll = gs => gs.reduce((sum, g) => sum + g.trees.length, 0);

  const unsub = data.subscribe(d => {
    groups = d.data;
  });
</script>

{#if groups}
  <h1>
    There are {groups.length} groups, totally {countAll(groups)} records..
  </h1>
  <!-- <FlameGraph timing={brokenRecords[0]} /> -->
  <ol>
    {#each groups as group}
      <li>
        <strong>
          {group.product} ({group.compiler} compiler) {group.build}:
        </strong>
        <ol>
          {#each group.trees as tree}
            <li>{tree.find('SassCompiler').derivedTotal}</li>
          {/each}
        </ol>
      </li>
    {/each}
  </ol>
{/if}
