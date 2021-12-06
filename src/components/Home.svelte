<script>
    import APIService from "../services/API.service"
    import { user } from "../stores"

    let user_value;
    user.subscribe(value => {
		user_value = value;
	});

    function handleClick(){
        APIService.get("/api/base")
    }

    function handleClickUser(){
        user.set({name: "StoredUser"})
    }
</script>

<h1>Home</h1>
<h1>Hello {user_value.name}</h1>
<button on:click="{handleClick}">ClickMe</button>   
<button on:click="{handleClickUser}">Login</button>   