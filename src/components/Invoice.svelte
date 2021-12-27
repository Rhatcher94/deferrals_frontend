<script>
    import { onMount } from 'svelte'
    import APIService from '../services/API.service';
    import { selectedInvoice, user } from "../stores"

    let user_value;
    user.subscribe(value => {
      user_value = value;
    });
    
    let selectedInvoice_value = {}
    selectedInvoice.subscribe(value => {
        selectedInvoice_value = value;
  	});

    async function createDeferralSchedule(item) {
      let deferralData = {
          "deferrals_invoice_id": selectedInvoice_value.invoice_id,
          "deferrals_item_id": item.item_id,
          "deferrals_total_run_times": item.item_custom_fields[0].value,
          "deferrals_times_ran": 0,
          "deferrals_total_amount": item.item_total,
          "deferrals_remaining_amount": item.item_total,
          "deferrals_next_run": null,
          "deferrals_last_run": null,
          "deferrals_all_complete": 0,
          "OrganizationId": user_value.OrganizationId
        }
      let response = await APIService.post("/api/organization/scheduled-deferrals", {data:deferralData})
      console.log(response)
    }


    onMount(async () => {
        console.log(selectedInvoice_value)
	});
</script>

<div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <input type="hidden" name="invoice">
    <div class="card-header"><h4>Invoice {selectedInvoice_value.invoice_number}</h4></div>
    <div class="card-body">
      <div class="card-text">
        <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">Customer Name</label>
          <input type="text" class="form-control" value="{selectedInvoice_value.customer_name}" readonly id="exampleInputPassword1">
        </div>
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">Date Created</label>
            <input type="text" class="form-control" value="{selectedInvoice_value.date}" readonly id="exampleInputPassword1">
        </div>
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">First Deferral</label>
            <input type="text" class="form-control" value="{selectedInvoice_value.date}" readonly id="exampleInputPassword1">
        </div>
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">Next Deferral</label>
            <input type="text" class="form-control" value="{selectedInvoice_value.date}" readonly id="exampleInputPassword1">
        </div> 
      </div>
    </div>
  </div>

  {#each selectedInvoice_value.line_items as line_item}
  {#if line_item.item_custom_fields[0] && line_item.item_custom_fields[0].value > 0}
    <div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
      <div class="card-header"><h4>{line_item.name}</h4></div>
      <div class="card-body">
        <div class="card-text">
          <div class="form-group">
            <label for="exampleInputPassword1" class="form-label">Account Name</label>
            <input type="text" class="form-control" value="{line_item.account_name}" readonly id="exampleInputPassword1">
          </div>
          <div class="form-group">
            <label for="exampleInputPassword1" class="form-label">Quantity</label>
            <input type="text" class="form-control" value="{line_item.quantity}" readonly id="exampleInputPassword1">
          </div>
          <div class="form-group">
            <label for="exampleInputPassword1" class="form-label">Rate</label>
            <input type="text" class="form-control" value="{line_item.rate}" readonly id="exampleInputPassword1">
          </div>
          <div class="form-group">
            <label for="exampleInputPassword1" class="form-label">Item Total</label>
            <input type="text" class="form-control" value="{line_item.item_total}" readonly id="exampleInputPassword1">
          </div>
          <div class="form-group">
            <label for="exampleInputPassword1" class="form-label">Deferral Term</label>
            <input type="text" class="form-control" value="{line_item.item_custom_fields[0].value}" readonly id="exampleInputPassword1">
          </div>
          <button type="button" on:click="{createDeferralSchedule(line_item)}" class="btn btn-primary mt-3">Create Deferral Schedule</button>
          <p class="text-danger mt-3">No Deferral Schedule has been generated for this item</p>    
        </div>
      </div>
    </div>
  {/if}
  {/each}