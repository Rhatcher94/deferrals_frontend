<script>
    import { onMount } from 'svelte';
    import OrganizationService from "../services/Organization.service";
    import router from "page"


    // your script goes here
    let headings = ["Organization Name", "Organization Level"]
    let organizations = []

    function selectOrganization(organizationId) {
        router.redirect(`/organization/${organizationId}`)
    }

    onMount(async () => {
      let new_organizations = await OrganizationService.getMany()
      organizations = new_organizations
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
      {#each organizations as organization}
      <tr class="table-primary">
        <td>{organization.organization_name}</td>
        <td>{organization.organization_level}</td>
        <td><button on:click|preventDefault="{selectOrganization(organization.id)}"></button></td>
      </tr>
      {/each}
    </tbody>
  </table>