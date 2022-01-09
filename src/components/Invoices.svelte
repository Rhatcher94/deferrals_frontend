<script>
  import { onMount } from 'svelte';
  import OrganizationService from "../services/Organization.service"
  import { invoices, user } from "../stores"
  import router from "page"

  let user_value;
  user.subscribe(value => {
    user_value = value;
    console.log(user_value)
  });

  let invoice_data = []
  let invoices_value = []
  let headings = ["Invoice Number", "Date Created", "Customer Name"]
  invoices.subscribe(value => {
      invoices_value = value;
      createInvoiceData()
  });

  function createInvoiceData() {
      invoices_value.forEach(invoice => {
          invoice_data.push(Object.values(invoice))
      });
      console.log(invoices_value)
  }

  function selectInvoice(invoice){
      router.redirect(`/invoice/${invoice.invoice_id}`);
  }

  onMount(async () => {
    let new_invoices = await OrganizationService.getInvoices(user_value.OrganizationId)
    invoices.update(value => value = new_invoices)
  });
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
    {#each invoices_value as invoice}
    <tr class="table-primary">
      <td>{invoice.invoice_number}</td>
      <td>{invoice.date}</td>
      <td>{invoice.customer_name}</td>
      <td><button on:click|preventDefault="{selectInvoice(invoice)}"></button></td>
    </tr>
    {/each}
  </tbody>
</table>

