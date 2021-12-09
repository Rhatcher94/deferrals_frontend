import { user } from "../stores"
import router from "page"
function CheckNoUser(ctx, next) {
    let user_value;
    user.subscribe(value => {
	  	user_value = value;
  	});

    if(user_value && user_value.username) {
        next()
    } else {
        router.redirect("/")
    }    
}

function CheckForUser(ctx, next){
    let user_value;
    user.subscribe(value => {
	  	user_value = value;
  	});

    if(user_value && user_value.username) {
        router.redirect("/home")
    } else {
        next()
    }    
}



export {CheckNoUser, CheckForUser}