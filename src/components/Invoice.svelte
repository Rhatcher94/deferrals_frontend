<script>
  import { onMount } from 'svelte'
  import APIService from '../services/API.service';
  import { user } from "../stores"

  export let params;

  let user_value;
  user.subscribe(value => {
    user_value = value;
  });
  let promise = setupPageData();
  let itemDeferrals = []
  let selectedInvoice = {}
  async function setupPageData() {
    let response = await APIService.get("/api/zoho/invoice", {org_id:1, invoice_id: params.id})
    selectedInvoice = response.data
    await setScheduledDeferral()
    //itemDeferrals = await getInvoiceItemDeferrals()
    
    console.log(selectedInvoice)  
  }

  function checkDate(date){
    const d1 = new Date(date);
    const d2 = new Date();

    console.log(d1,d2)
  }

  function formatDate(date) {      
    const words = date.split('T');
    checkDate(date)
    return words[0]
  }

  let loadingDeferral = false
  let createPromise = {}
  async function runDeferral(id) {
    loadingDeferral = true
    createPromise = await APIService.post("/api/zoho/run_deferral", {"scheduled_deferral_id": id})
    promise = setupPageData()
    loadingDeferral = false
  }

  async function createDeferralSchedule(item) {
    let deferralData = {
        "deferrals_invoice_id": selectedInvoice.invoice_id,
        "deferrals_item_id": item.line_item_id,
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
  }

  async function setScheduledDeferral() {
    console.log(selectedInvoice)
    for (let index = 0; index < selectedInvoice.line_items.length; index++) {
      const element = selectedInvoice.line_items[index];
      if(element.item_custom_fields && element.item_custom_fields[0]) {
        let scheduledDeferral = await getInvoiceItemDeferral(element.line_item_id)
        selectedInvoice.line_items[index].scheduledDeferral = scheduledDeferral
      }
    }
  }

  async function getInvoiceItemDeferral(item_id) {
    let response = await APIService.get("/api/organization/scheduled-deferrals", {by:'item_id', item_id: item_id, type:'one'})
    console.log("ScheduledDeferrals", response.data)
    return response.data;
  }
  onMount(async () => {
      promise = setupPageData()
  });
</script>
{#await promise}
<h1>Loading...</h1>
{:then}
{#if selectedInvoice.line_items}  
<div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
  <input type="hidden" name="invoice">
  <div class="card-header"><h4>Invoice {selectedInvoice.invoice_number}</h4></div>
  <div class="card-body">
    <div class="card-text">
      <div class="form-group">
        <label for="exampleInputPassword1" class="form-label mt-4">Customer Name</label>
        <input type="text" class="form-control" value="{selectedInvoice.customer_name}" readonly id="exampleInputPassword1">
      </div>
      <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">Date Created</label>
          <input type="text" class="form-control" value="{selectedInvoice.date}" readonly id="exampleInputPassword1">
      </div>
      <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">First Deferral</label>
          <input type="text" class="form-control" value="{selectedInvoice.date}" readonly id="exampleInputPassword1">
      </div>
      <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">Next Deferral</label>
          <input type="text" class="form-control" value="{selectedInvoice.date}" readonly id="exampleInputPassword1">
      </div> 
    </div>
  </div>
</div>
{#each selectedInvoice.line_items as line_item}
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
        
        {#if !line_item.scheduledDeferral }          
        <button type="button" on:click="{createDeferralSchedule(line_item)}" class="btn btn-primary mt-3">Create Deferral Schedule</button>
        <p class="text-danger mt-3">No Deferral Schedule has been generated for this item</p>    
        {:else}
        {#if line_item.scheduledDeferral.needsRun }  
          <button type="button" class="btn btn-danger mt-3" on:click="{runDeferral(line_item.scheduledDeferral.id)}">Run Deferral</button>
        {/if}
        <p>Next Deferral Date: {formatDate(line_item.scheduledDeferral.deferrals_next_run)}</p>
        <p class="text-success mt-3">A deferral schedule has been made for this item!</p>
        {/if}
        {#if loadingDeferral }
          <p>Running Deferral.....</p>
        {/if}
      </div>
    </div>
  </div>
{/if}
{/each}
{:else}
<h1>Loading...</h1>
{/if}
{/await}