<script>
    export let bgColour = 'primary';
    export let brand = 'Home';
    import { user } from "../stores"
    import router from "page"
    export let navLinks = [{name: 'Home', link: '/home'}, {name: 'About', link: '/about'}, {name: 'Contact', link: '/contact'}]

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
    <a class="navbar-brand" href="#">{brand}</a>

    <div class="collapse navbar-collapse" id="navbarColor01">
      <ul class="navbar-nav me-auto">
        {#each navLinks as nav}
        <li class="nav-item">
          <a class="nav-link" href="{nav.link}">{nav.name}
          </a>
        </li>
        {/each}
      </ul>
      <form class="d-flex">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link" href="#">{user_value.user_level}
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" on:click="{logout}" href="#">Logout
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
      <a class="navbar-brand" href="#">{brand}</a>
  
      <div class="collapse navbar-collapse" id="navbarColor01">
        <ul class="navbar-nav me-auto">
        </ul>
        <form class="d-flex">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" href="#">Login
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