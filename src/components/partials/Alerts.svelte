<script>
    import { showMessage } from "../../stores"
    let showMessage_value;
    showMessage.subscribe(value => {
        showMessage_value = value;
        if(showMessage_value.show === true) {
            window.scrollTo(0,0);
            setTimeout(hideMessage, 20000);
        }
  	});

    function hideMessage(){
        showMessage.update(newValue => newValue = {show: false, message: "", type: "", header: ""})
    }
</script>


{#if showMessage_value.show}
<div class="alert alert-dismissible alert-{showMessage_value.alert_type.toLowerCase()}">
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    <h4 class="alert-heading">{showMessage_value.type}!</h4>
    <p class="mb-0">{showMessage_value.message}</p>
</div>
{/if}