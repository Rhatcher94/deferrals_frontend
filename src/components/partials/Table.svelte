<script>
    export let rowColour = 'primary';
    export let headings = ['heading1', 'heading2', 'heading3']
    export let rows = [["col1", "col2", "col3"], ["col1", "col2", "col3"], ["col1", "col2", "col3"], ["col1", "col2", "col3"], ["col1", "col2", "col3"]]
</script>

<table class="table table-hover">
  <thead>
    <tr>
    {#each headings as heading}
      <th scope="col">{heading}</th>
    {/each}
    </tr>
  </thead>
  <tbody>
    {#each rows as row}
    <tr class="table-{rowColour}">
      {#each row as col}
        <th scope="row">{col}</th>
      {/each}
    </tr>
    {/each}
  </tbody>
</table>