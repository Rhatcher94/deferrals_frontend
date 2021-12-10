<script>
    import APIService from "../services/API.service"
    import { user } from "../stores"

    let user_value;
    user.subscribe(value => {
		user_value = value;
        console.log(user_value)
	});
</script>

<h1>Welcome {user_value.username}</h1>