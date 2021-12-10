<script>
    import APIService from "../services/API.service"
    import { user } from "../stores"
    import router from "page"

    let user_value;
    user.subscribe(value => {
		user_value = value;
	});

    let showMessage = false
    let loginMessage = ""

    let username
    let password
    
    async function handleLoginClick(e){
        let loginSuccess = false
        if(username && password) {
            let response = await APIService.post("/api/user/login", {username: username, password: password, type: "creds"})
            if(response.status && response.status === 200) {
                let data = response.data
                if(data.status === "Success") {
                    loginSuccess = true
                } else {
                    loginSuccess = false
                }
                
                if(loginSuccess){
                    user.update(user => user = data.data.user)
                    localStorage.setItem("app_user", JSON.stringify(user_value));
                    localStorage.setItem("app_token", data.data.token);
                    router.redirect("/home")
                    
                } else {
                    showMessage = true
                    loginMessage = "Log in Failed"
                }
            }
        }
        return loginSuccess
    }

</script>
<div class="login-container">
    <p hidden="{!showMessage}">{loginMessage}</p>
    <form>
        <fieldset>
            <h3 class="text-center text-white pt-5">Login form</h3>
            <div class="form-group">
                <label for="exampleInputEmail1" class="form-label mt-4">Username</label>
                <input type="text" class="form-control" id="userInput" bind:value={username} placeholder="Enter Username">
            </div>
            <div class="form-group">
                <label for="exampleInputPassword1" class="form-label mt-4">Password</label>
                <input type="password" class="form-control" id="passwordInput" bind:value={password} placeholder="Password">
            </div>
        </fieldset>
        <button type="submit" class="btn btn-primary mt-3" on:click|preventDefault="{handleLoginClick}">Submit</button>
      </form>
</div>


<style>
    .login-container{
        width: 50%;
        margin: auto;
    }
</style>
