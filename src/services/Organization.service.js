import APIService from "./API.service"

const OrganizationService = {
    get: async function(id) {
        let response = await APIService.get("/api/organization", {type: "one", id: id})
        return (response.data)
    },
    update: async function(data) {
        let response = await APIService.put("/api/organization", {data: data})
        return response.data
    }
}
export default OrganizationService