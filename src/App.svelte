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
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    font-size: 2em;
    font-weight: 100;
    text-align: center;
  }

  h2,
  p,
  ol {
    width: 90%;
    max-width: 650px;
    text-align: left;
    margin: auto;
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

  h2 {
    margin-top: 2em;
  }

  figure {
    text-align: center;
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
    <h1>Dart Sass v. Lib Sass</h1>
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
  {/if}
</main>
