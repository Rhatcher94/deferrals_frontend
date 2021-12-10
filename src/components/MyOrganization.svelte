<script>
    import { onMount } from 'svelte';
    import OrganizationService from "../services/Organization.service"
    import { myOrganization } from "../stores"

    let myOrganization_value = {}
    myOrganization.subscribe(value => {
        myOrganization_value = value;
  	});   

    function updateOrganization(){
        OrganizationService.update(myOrganization_value)
    }

    onMount(async () => {
        let organization = await OrganizationService.get(1)
        myOrganization.update(org => org = organization)
	});
</script>
<div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <div class="card-header">My Organization</div>
    <div class="card-body">
      <h4 class="card-title">{myOrganization_value.organization_name}</h4>
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
        <button type="button" on:click="{updateOrganization}" class="btn btn-danger mt-3">Generate AUTH</button>
      </div>
    </div>
  </div>
