<script>
    import { onMount } from 'svelte'
    import OrganizationService from '../services/Organization.service';

    export let params;

    let username
    let password
    let passwordConfirm
    let error = ""

    let selectedOrganization = {}

    let orgUsers = []
    async function getOrgUsers() {
        orgUsers = await OrganizationService.getOrgUsers(params.id)
    }

    async function clickAddUser() {
        if(password === passwordConfirm) {
            console.log("Add")
            let newUser = await OrganizationService.addOrgUser({username: username, password: password, user_level: 3, OrganizationId: params.id })
            getOrgUsers()
        } else {
            error = "Passwords do not match"
        }
    }

    onMount(async () => {
        let organization = await OrganizationService.get(params.id)
        selectedOrganization = organization
        getOrgUsers()
        console.log(selectedOrganization)
	});
</script>

<div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <div class="card-header"><h4>{selectedOrganization.organization_name}</h4></div>
    <div class="card-body">
      <div class="card-text">
        <div class="form-group">
          <label for="exampleInputPassword1" class="form-label mt-4">Zoho ID</label>
          <input type="text" class="form-control" value="{selectedOrganization.organization_zoho_id}" readonly id="exampleInputPassword1">
        </div>
        <div class="form-group">
            <label for="exampleInputPassword1" class="form-label mt-4">Account Level</label>
            <input type="text" class="form-control" value="{selectedOrganization.organization_level}" readonly id="exampleInputPassword1">
        </div>
      </div>
    </div>
</div>

<div class="card border-secondary mb-3 m-auto mt-3" style="max-width: 50vw;">
    <div class="card-header"><h4>Users</h4></div>
    <div class="card-body">
        <button type="button" class="btn btn-primary mt-3" data-toggle="modal" data-target="#AddUserModal">+ Add</button>
      <div class="card-text">
        <div class="row mt-4">
            {#each orgUsers as user}
                <div class="col-5">
                    <div class="card border-dark mb-3" style="max-width: 20rem;">
                        <div class="card-header"><h4>{user.username}</h4></div>
                        <div class="card-body">
                          <p class="card-text">User Level: {user.user_level}</p>
                        </div>
                      </div>
                </div>
            {/each}
          </div>
      </div>
    </div>
</div>

<div class="modal fade hidden" id="AddUserModal">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Organization User</h5>
          <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true"></span>
          </button>
        </div>
        <div class="modal-body">
            <form>
                <fieldset>
                    <p class="text-center text-danger">{error}</p>
                    <div class="form-group">
                        <label for="exampleInputEmail1" class="form-label">Username</label>
                        <input type="text" class="form-control" id="userInput" bind:value={username} placeholder="Enter Username">
                    </div>
                    <div class="form-group">
                        <label for="exampleInputPassword1" class="form-label">Password</label>
                        <input type="password" class="form-control" id="passwordInput" bind:value={password} placeholder="Password">
                    </div>
                    <div class="form-group">
                        <label for="exampleInputPassword1" class="form-label">Confirm Password</label>
                        <input type="password" class="form-control" id="passwordInput" bind:value={passwordConfirm} placeholder="Confirm Password">
                    </div>
                </fieldset>
                <button type="submit" class="btn btn-primary mt-3" data-dismiss="modal" on:click|preventDefault="{clickAddUser}">Submit</button>
              </form>
        </div>
      </div>
    </div>
  </div>
  