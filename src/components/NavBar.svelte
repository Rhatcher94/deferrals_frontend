<script>
    export let bgColour = 'primary';
    export let brand = 'Home';
    export let navLinks = [{name: 'Home', link: '/home'}, {name: 'About', link: '/about'}, {name: 'Contact', link: '/contact'}]
</script>
<nav class="navbar navbar-expand-lg navbar-{bgColour == 'secondary' ? 'light' : 'dark'} bg-{bgColour}">
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
              <a class="nav-link" href="#">Logout
              </a>
            </li>
          </ul>
        </form>
      </div>
    </div>
  </nav>

<style>
    /* your styles go here */
</style>