<script>
  import { onMount } from "svelte";
  import TimingTree from "./timing-tree";
  import data from "./data";
  import HeatMap from "./HeatMap.svelte";
  import DistributionViz from "./DistributionViz.svelte";
  import FlameGraph from "./FlameGraph.svelte";

  export let dataPath;

  let dataRequest = {};

  let selectedProduct = "tf-registry";
  let selectedBuild = "serve-rebuild";

  let deepProduct = "consul";
  let deepBuild = "build-warm-dev";
  let deepCompiler = "dart";
  let deepRun = 0;
  let deepTiming;

  $: {
    const deepTimings =
      dataRequest &&
      dataRequest.data &&
      dataRequest.data.find(
        group =>
          group.product === deepProduct &&
          group.build === deepBuild &&
          group.compiler === deepCompiler
      );
    deepTiming = deepTimings && deepTimings.trees[deepRun];
  }

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

  function clearDrilldown() {
    clearFromProduct();
    deepProduct = null;
  }

  function clearFromProduct() {
    clearFromBuild();
    deepBuild = null;
  }

  function clearFromBuild() {
    clearFromCompiler();
    deepCompiler = null;
  }

  function clearFromCompiler() {
    deepRun = null;
  }
</script>

<style>
  main {
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1,
  h2 {
    font-family: serif;
    letter-spacing: -0.08ch;
  }

  h1 {
    color: #556;
    font-size: 3em;
    font-weight: 800;
    text-align: center;
  }

  h1 .lib {
    color: #438abd;
  }

  h1 .dart {
    color: #d47b1c;
  }

  h2 {
    font-size: 2em;
    margin-top: 2em;
  }

  h2,
  p,
  ol {
    width: 90%;
    max-width: 650px;
    text-align: left;
    margin-left: auto;
    margin-right: auto;
  }

  li {
    margin-bottom: 0.4em;
  }

  li > strong {
    display: inline-block;
    width: 125px;
  }

  p {
    margin: 1.5em auto;
  }

  figure {
    text-align: center;
  }

  .button-bar {
    margin: auto;
    margin-bottom: 0.5em;
    display: flex;
    justify-content: center;
  }

  .button-bar label {
    padding: 10px;
    background: #eee;
    border: 1px solid #bbb;
    border-radius: 3px;
  }

  .button-bar label + label {
    margin-left: 6px;
  }

  .button-bar label input {
    padding-right: 5px;
  }

  .drilldown {
    display: flex;
    justify-content: center;
  }

  .drilldown select + select {
    margin-left: 6px;
  }

  .drilldown select option:first-child {
    color: #666;
  }

  .drilldown button {
    margin-left: 12px;
    border: none;
    background: transparent;
    color: #992222;
    cursor: pointer;
  }

  .drilldown button:hover {
    color: #c26565;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  {#if dataRequest.isLoading}
    <h1>Loading all the data (150MB)...</h1>
  {:else if dataRequest.error}
    <h1>Uh oh... {dataRequest.error}</h1>
  {:else}
    <h1>
      <span class="dart">Dart</span>
      Sass v.
      <span class="lib">Lib</span>
      Sass
    </h1>
    <p>
      It's commonly understood and documented that Lib Sass is faster than Dart
      Sass, but by how much? Given the total amount of time Ember spends
      building, is the time difference meaningful?
    </p>

    <p>
      Data was collected for Consul, Nomad, Terraform Cloud, Terraform Registry,
      and Vault across six build scenarios:
    </p>
    <ol>
      <li>
        <strong>build-cold-dev:</strong>
        Running
        <code>ember build</code>
        without any existing dist or tmp dirs.
      </li>
      <li>
        <strong>build-cold-prod:</strong>
        Running
        <code>ember build --prod</code>
        without any existing dist or tmp dirs.
      </li>
      <li>
        <strong>build-warm-dev:</strong>
        Running
        <code>ember build</code>
        with existing dist and tmp dirs.
      </li>
      <li>
        <strong>build-warm-dev:</strong>
        Running
        <code>ember build --prod</code>
        with existing dist and tmp dirs.
      </li>
      <li>
        <strong>serve-build:</strong>
        Running
        <code>ember serve</code>
        without existing tmp dirs.
      </li>
      <li>
        <strong>serve-rebuild:</strong>
        Touching the
        <code>app/styles/app.scss</code>
        file while the ember serve is running.
      </li>
    </ol>

    <h2>Sass Timings Comparison</h2>
    <p>
      The amount of time spent compiling Sass and doing Sass related tasks for
      application styles.
    </p>
    <p>
      There is notable banding between dev and prod builds (aside from TF
      Registry for some reason) which suggests that the time difference saved in
      the sass compiler is muted by the amount of time spent in minification.
    </p>
    <figure>
      <HeatMap fieldFn={t => t.findStyleRoot().derivedTotal} domain={7} />
    </figure>

    <h2>Total Timings Comparison</h2>
    <p>The amount of time spent for the entire build.</p>
    <p>
      Dart shows up on the board a few times, which really drives home that the
      time savings from using Lib Sass becomes a margin of error in the grand
      scheme of things.
    </p>
    <p>
      This insight is worth noting when it comes to running tests, which will
      emulate
      <code>serve-build</code>
      , but the most important Developer Experience metric is
      <code>serve-rebuild</code>
      .
    </p>
    <p>
      Since rebuilds only rerun the necessary broccoli trees, the time
      difference is felt more here. However, the speed up is 0.2-1.7x faster,
      which is significantly less than the 0.7-6.2x speed up seen in Sass
      Compiler metrics above.
    </p>
    <figure>
      <HeatMap fieldFn={t => t.root.derivedTotal} domain={2} />
    </figure>
    <h2>Dive Deeper</h2>
    <p>
      Choose a product and a build type to see the distribution of all runs
      captured in the aggregate median metrics.
    </p>
    <div class="button-bar">
      <label>
        <input
          type="radio"
          bind:group={selectedProduct}
          name="product"
          value="consul" />
        Consul
      </label>
      <label>
        <input
          type="radio"
          bind:group={selectedProduct}
          name="product"
          value="nomad" />
        Nomad
      </label>
      <label>
        <input
          type="radio"
          bind:group={selectedProduct}
          name="product"
          value="tf-cloud" />
        TF Cloud
      </label>
      <label>
        <input
          type="radio"
          bind:group={selectedProduct}
          name="product"
          value="tf-registry" />
        TF Registry
      </label>
      <label>
        <input
          type="radio"
          bind:group={selectedProduct}
          name="product"
          value="vault" />
        Vault
      </label>
    </div>
    {#if selectedProduct}
      <div class="button-bar">
        <label>
          <input
            type="radio"
            bind:group={selectedBuild}
            name="build"
            value="build-cold-dev" />
          Build Cold Dev
        </label>
        <label>
          <input
            type="radio"
            bind:group={selectedBuild}
            name="build"
            value="build-cold-prod" />
          Build Cold Prod
        </label>
        <label>
          <input
            type="radio"
            bind:group={selectedBuild}
            name="build"
            value="build-warm-dev" />
          Build Warm Dev
        </label>
        <label>
          <input
            type="radio"
            bind:group={selectedBuild}
            name="build"
            value="build-warm-prod" />
          Build Warm Prod
        </label>
        <label>
          <input
            type="radio"
            bind:group={selectedBuild}
            name="build"
            value="serve-build" />
          Serve Build
        </label>
        <label>
          <input
            type="radio"
            bind:group={selectedBuild}
            name="build"
            value="serve-rebuild" />
          Serve Rebuild
        </label>
      </div>
    {/if}
    {#if selectedProduct && selectedBuild}
      <figure>
        <DistributionViz product={selectedProduct} build={selectedBuild} />
      </figure>
    {/if}
    <h2>Dive Even Deeper</h2>
    <p>
      Choose a product, a build type, a compiler, and an individual timing to
      see the flame graph of the build.
    </p>
    <div class="drilldown">
      <select bind:value={deepProduct}>
        <option value={null}>-- product --</option>
        <option value="consul">Consul</option>
        <option value="nomad">Nomad</option>
        <option value="tf-cloud">TF Cloud</option>
        <option value="tf-registry">TF Registry</option>
        <option value="vault">Vault</option>
      </select>
      {#if deepProduct}
        <select bind:value={deepBuild}>
          <option value={null}>-- build type --</option>
          <option value="build-cold-dev">Build Cold Dev</option>
          <option value="build-cold-prod">Build Cold Prod</option>
          <option value="build-warm-dev">Build Warm Dev</option>
          <option value="build-warm-prod">Build Warm Prod</option>
          <option value="serve-build">Serve Build</option>
          <option value="serve-rebuild">Serve Rebuild</option>
        </select>
      {/if}
      {#if deepBuild}
        <select bind:value={deepCompiler}>
          <option value={null}>-- compiler --</option>
          <option value="dart">Dart Sass</option>
          <option value="lib">Lib Sass</option>
        </select>
      {/if}
      {#if deepCompiler}
        <select bind:value={deepRun}>
          <option value={null}>-- run number --</option>
          <option value={0}>One</option>
          <option value={1}>Two</option>
          <option value={2}>Three</option>
          <option value={3}>Four</option>
          <option value={4}>Five</option>
        </select>
      {/if}
      <button on:click={clearDrilldown}>Clear</button>
    </div>
    {#if deepTiming}
      <figure>
        <FlameGraph
          timing={deepTiming}
          name={`${deepProduct} > ${deepBuild} > ${deepCompiler} (${deepRun + 1} of 5)`} />
      </figure>
    {/if}
    <h2>Conclusion</h2>
    <p>
      Although Lib Sass is in fact considerably faster than Dart Sass, the gains
      are dilluted by other work happening in every build scenario.
    </p>
    <p>
      The only realistic scenario in which Lib Sass is notably faster than Dart
      Sass (from a developer experience standpoint) is rebuilds. Even here, the
      time difference is 1.7s to 4.5s in the worst case.
    </p>
    <h2>Appendix 1. Methodology</h2>
    <p>
      All timing data was collected using Ember CLI's internal timing mechanism
      exposed through the
      <code>BROCCOLI_VIZ=1</code>
      environment variable.
    </p>

    <p>
      Each timing target (product + build type + compiler) is measured five
      times to account for environmental variability. The median value is used
      to aggregate analysis to best account for outliers.
    </p>

    <p>
      To further account for environmental variability, all data was collected
      on the same day on a mostly idle Macbook Pro (2016 3.3GHz, 16 GB 2133 MHz,
      SSD storage).
    </p>
    <h2>Appendix 2. Reproducible Science</h2>
    <p>
      All science should be reproducible, this analysis is no exception. This
      analysis is the product of two open source projects.
      <a
        href="https://github.com/DingoEatingFuzz/ember-metrics"
        target="_blank"
        rel="noopener noreferrer">
        Ember Timings
      </a>
      , a script used to collect all six build measurements N times for an Ember
      project. And
      <a
        href="https://github.com/DingoEatingFuzz/sass-timings-report"
        target="_blank"
        rel="noopener noreferrer">
        Sass Timings Report
      </a>
      , the report you are looking at, which includes all data transformations
      from the original Heimdall exports to Vega Lite charts.
    </p>

    <p>
      Consul, Nomad, and Vault are all open source projects, so for these three
      products, all analysis can be reproduced by anyone. Terraform Cloud and
      Terraform Registry are closed source but analysis will still be
      reproducible for authorized HashiCorp contributors.
    </p>
  {/if}
</main>
