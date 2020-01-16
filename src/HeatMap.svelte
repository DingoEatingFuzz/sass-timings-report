<script>
  import data from "./data";

  let records = [];

  const unsub = data.subscribe(d => {
    records = d.data;
  });
</script>

<h1>There are {records && records.length} records.</h1>
