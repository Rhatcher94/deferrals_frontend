<script>
	import NavBar from "./components/NavBar.svelte"
	import { onMount } from 'svelte';
	import router from "page"
	import About from "./components/About.svelte"
	import Home from "./components/Home.svelte"
	import NotFound from "./components/404.svelte"
	import Login from "./components/Login.svelte"
	import { user } from "./stores"
	import {CheckNoUser, CheckForUser} from "./middleware/CheckUser"

	let page 
	router('/about', CheckNoUser ,() => page = About)
	router('/home', CheckNoUser ,() => page = Home)
	router('/', CheckForUser, () => page = Login)
	router('*', () => page = NotFound)

	onMount(async () => {
		let storedUser = localStorage.getItem("app_user");
		user.update(user => user = JSON.parse(storedUser))
		router.start()
	});

</script>

<main>
	<NavBar bgColour="dark" brand="Base"/>
	<svelte:component this={page} />
</main>

<style>
	main {
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