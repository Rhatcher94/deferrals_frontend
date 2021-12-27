import { showMessage } from "../stores"

function ShowMessage(response, successMessage) {
    let alert_type = response.data.status === "success" ? "success" : "danger"
    let type = response.data.status === "success" ? "Success" : "Error"
    let message = response.data.status === "success" ? successMessage : `${response.data.data}`
    showMessage.update(newValue => newValue = {show: true, message: message, alert_type: alert_type, type: type})
}

export default ShowMessage