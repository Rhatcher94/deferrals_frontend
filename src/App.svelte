<script>
	import NavBar from "./components/NavBar.svelte"
	import Alerts from "./components/partials/Alerts.svelte"
	import { onMount } from 'svelte';
	import router from "page"
	import { user } from "./stores"
	import {CheckNoUser, CheckForUser} from "./middleware/CheckUser"

	//Pages
	import About from "./components/About.svelte"
	import Home from "./components/Home.svelte"
	import NotFound from "./components/404.svelte"
	import Login from "./components/Login.svelte"
	import MyOrganization from "./components/MyOrganization.svelte"
	import Invoices from "./components/Invoices.svelte"
	import Invoice from "./components/Invoice.svelte"
	import Organizations from "./components/Organizations.svelte"
	import Organization from "./components/Organization.svelte"

	let page
	let params

	router('/organization/:id', SetParams, CheckNoUser ,() => page = Organization)
	router('/organizations', CheckNoUser ,() => page = Organizations)
	router('/invoice', CheckNoUser ,() => page = Invoice)
	router('/invoices', CheckNoUser ,() => page = Invoices)
	router('/organization', CheckNoUser ,() => page = MyOrganization)
	router('/about', CheckNoUser ,() => page = About)
	router('/home', CheckNoUser ,() => page = Home)
	router('/', CheckForUser, () => page = Login)
	router('*', () => page = NotFound)

	onMount(async () => {
		let storedUser = localStorage.getItem("app_user");
		user.update(user => user = JSON.parse(storedUser))
		router.start()
	});

	function SetParams(ctx, next) {
    	params = ctx.params
    	next()
	}

</script>

<main>
	<NavBar bgColour="dark" brand="ZD"/>
	<Alerts />
	<svelte:component this={page} params="{params}" />
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