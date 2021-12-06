<script>
	import NavBar from "./components/NavBar.svelte"
	import router from "page"
	import About from "./components/About.svelte"
	import Home from "./components/Home.svelte"
	import NotFound from "./components/404.svelte"
	import Login from "./components/Login.svelte"

	let page 
	router('/about', () => page = About)
	router('/home', () => page = Home)
	router('/', () => page = Login)
	router('*', () => page = NotFound)
	router.start()
</script>

<main>
	<NavBar bgColour="dark" brand="Base"/>
	<svelte:component this={page} />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>