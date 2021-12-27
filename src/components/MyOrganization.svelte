<script>
    import { onMount } from 'svelte';
    import OrganizationService from "../services/Organization.service"
    import { myOrganization, user } from "../stores"

    let user_value;
    user.subscribe(value => {
		  user_value = value;
	  });

    let myOrganization_value = {}
    myOrganization.subscribe(value => {
        myOrganization_value = value;
  	});   

    function updateOrganization(){
        OrganizationService.update(myOrganization_value)
    }

    let zoho_code = ""
    function generateZohoAUTH(){
        OrganizationService.createOAUTH({"org_id": myOrganization_value.id, "code": zoho_code})
    }

    let booksAccounts = []
    async function getBooksAccounts(){
      console.log("in books account")
      booksAccounts = await OrganizationService.getBooksAccounts(user_value.OrganizationId)
      console.log(booksAccounts)
    }

    let booksAccountCode = ""
    async function clickAddBooksAccount() {
      if(booksAccountCode.length > 1) {
        let newBooksAccount = await OrganizationService.addBooksAccount(booksAccountCode ,user_value.OrganizationId)
        if(newBooksAccount.data.id) {
          await getBooksAccounts()
          console.log(newBooksAccount)
        }
      }
    }

    async function clickDeleteBooksAccount(booksAccountId) {
      let deleteBooksAccount = await OrganizationService.removeBooksAccount(booksAccountId ,user_value.OrganizationId)
      if(deleteBooksAccount.data === 1) {
        await getBooksAccounts()
        console.log(deleteBooksAccount.data)
      }
    }

    onMount(async () => {
        let organization = await OrganizationService.get(user_value.OrganizationId)
        myOrganization.update(org => org = organization)
        await getBooksAccounts()
	  });
</script>
<div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <div class="card-header"><h4>{myOrganization_value.organization_name}</h4></div>
    <div class="card-body">
      <div class="card-text">
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">Zoho ID</label>
            <input type="text" class="form-control" id="exampleInputPassword1" bind:value="{myOrganization_value.organization_zoho_id}" placeholder={myOrganization_value.organization_zoho_id}>
        </div>
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">Client ID</label>
            <input type="text" class="form-control" id="exampleInputPassword1" bind:value="{myOrganization_value.organization_client_id}" placeholder={myOrganization_value.organization_client_id}>
        </div>
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">Client Secret</label>
            <input type="text" class="form-control" id="exampleInputPassword1" bind:value="{myOrganization_value.organization_client_secret}" placeholder={myOrganization_value.organization_client_secret}>
        </div>
        <button type="button" on:click="{updateOrganization}" class="btn btn-primary mt-3">Update</button>
        <button type="button" class="btn btn-danger mt-3" data-toggle="modal" data-target="#OAUTHModal">Generate AUTH</button>
        <p class="text-success mt-3" hidden={!myOrganization_value.zoho_refresh_token}>Zoho Auth has been setup</p>
      </div>
    </div>
  </div>

  <div class="modal fade hidden" id="OAUTHModal">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Generate Zoho Code</h5>
          <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true"></span>
          </button>
        </div>
        <div class="modal-body">
            <div class="form-group">
              <label for="exampleInputPassword1" class="form-label mt-4">Generated Code</label>
              <input type="text" class="form-control" id="zohoGeneratedCode" bind:value="{zoho_code}">
           </div>
        </div>
        <div class="modal-footer">
          <button type="button" disabled="{zoho_code.length < 10}" class="btn btn-primary" data-dismiss="modal" on:click|preventDefault="{generateZohoAUTH}">Generate</button>
        </div>
      </div>
    </div>
  </div>

  <div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <div class="card-header"><h4>Zoho Details</h4></div>
    <div class="card-body">
      <div class="card-text">
        <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">Invoice Custom Field</label>
          <input type="text" class="form-control" id="exampleInputPassword1">
        </div>
        <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">Deferral Accounts</label>
          <input type="text" class="form-control" id="exampleInputPassword1">
        </div>  
        <button type="button" on:click="{updateOrganization}" class="btn btn-primary mt-3">Update</button>            
      </div>
    </div>
  </div>

  <div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <div class="card-header"><h4>Bank Accounts</h4></div>
    <div class="card-body">
      <div class="card-text">
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">New Bank Account</label>
            <input type="text" class="form-control" bind:value="{booksAccountCode}" id="exampleInputPassword1" placeholder="Account Code">
            <button type="button" class="btn btn-primary mt-3" on:click|preventDefault="{clickAddBooksAccount}">Add</button>
        </div>
        <br />
        {#if booksAccounts.length > 0}
          <h5>Account Code</h5>
          {#each booksAccounts as account}
            <div class="row">
              <div class="col-sm">
                <p class="text-success">{account.books_account_code}</p> 
              </div>
              <div class="col-sm">
                <a href="/" on:click|preventDefault="{clickDeleteBooksAccount(account.books_account_code)}">X</a>
              </div>
            </div>
          {/each}
          {:else}
          <h5>No books accounts added</h5>
        {/if}
      </div>
    </div>
  </div>