import APIService from "./API.service"
import ShowMessage from "../helpers/ShowMessage"

const OrganizationService = {
    get: async function(id) {
        let response = await APIService.get("/api/organization", {type: "one", id: id})
        return (response.data)
    },
    getMany: async function () {
        let response = await APIService.get("/api/organization", {type: "many"})
        return (response.data)
    },
    getOrgUsers: async function (org_id) {
        let response = await APIService.get("/api/organization", {type: "org_users", org_id: org_id})
        return (response.data)
    },
    update: async function(data) {
        let response = await APIService.put("/api/organization", {data: data})
        ShowMessage(response, "Your Organization has been updated")
        return response.data
    },
    createOAUTH: async function(data) {
        let response = await APIService.post("/api/zoho", {data: data})
        ShowMessage(response, "Auth Created")
        return response.data
    }, 
    getInvoices: async function(id) {
        let response = await APIService.get("/api/zoho/invoices", {"org_id": id})
        return response.data
    },
    getBooksAccounts: async function(org_id) {
        let response = await APIService.get("/api/organization/books/account", {"org_id": org_id, type: "many"})
        return response.data
    },
    addBooksAccount: async function (books_account_code, books_account_type, org_id) {
        let response = await APIService.post("/api/organization/books/account", {data: {books_account_type: books_account_type, books_account_code: books_account_code, org_id: org_id}})
        ShowMessage(response, "Your Books Account has been added")
        return response.data
    },
    removeBooksAccount: async function (books_account_code, org_id) {
        let response = await APIService.delete("/api/organization/books/account", {books_account_code: books_account_code, org_id: org_id})
        ShowMessage(response,"Your Books Account has been removed")
        return response.data
    }, 
    addOrgUser: async function (data) {
        let response = await APIService.post("/api/user", {data: data})
        ShowMessage(response, "Organization User has been added")
        return response.data
    }
    
}
export default OrganizationService