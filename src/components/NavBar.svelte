<script>
    export let bgColour = 'primary';
    export let brand = 'Home';
    import { user } from "../stores"
    import router from "page"
    //Nav links based on user level
    let navLinks = {
      1:[
        {name: 'Organizations', link: '/organizations'}, 
        {name: 'Users', link: '/users'},
        {name: 'Invoices', link: '/invoices'},
        {name: 'My Organization', link: '/organization'}, 
        {name: 'Organization Users', link: '/organization-users'}
      ], 
      2:[
        {name: 'Invoices', link: '/invoices'},
        {name: 'My Organization', link: '/organization'}, 
        {name: 'Organization Users', link: '/organization-users'}
      ],
      3:[
        {name: 'Invoices', link: '/invoices'}, 
      ],
    }

    let user_value;
    user.subscribe(value => {
	  	user_value = value;
  	});

    function logout(){
      user.update(user => user = {})
      localStorage.removeItem("app_user");
      router.redirect("/")
    }

</script> 
{#if user_value && user_value.username}
<nav id="logged_out_nav" class="navbar navbar-expand-lg navbar-{bgColour == 'secondary' ? 'light' : 'dark'} bg-{bgColour}">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">{user_value.Organization.organization_name ?user_value.Organization.organization_name : brand}</a>

    <div class="collapse navbar-collapse" id="navbarColor01">
      <ul class="navbar-nav me-auto">
        {#each navLinks[user_value.user_level] as nav}
        <li class="nav-item">
          <a class="nav-link" href="{nav.link}">{nav.name}
          </a>
        </li>
        {/each}
      </ul>
      <form class="d-flex">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link" on:click="{logout}" href="/">Logout
            </a>
          </li>
        </ul>
      </form>
    </div>
  </div>
</nav>
{:else}
<nav id="logged_in_nav" class="navbar navbar-expand-lg navbar-{bgColour == 'secondary' ? 'light' : 'dark'} bg-{bgColour}">
    <div class="container-fluid">
      <a class="navbar-brand" href="/">{brand}</a>
  
      <div class="collapse navbar-collapse" id="navbarColor01">
        <ul class="navbar-nav me-auto">
        </ul>
        <form class="d-flex">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" href="/">Login
              </a>
            </li>
          </ul>
        </form>
      </div>
    </div>
  </nav>
  {/if}
<style>
    /* your styles go here */
</style>