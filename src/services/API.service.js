import axios from "axios"

const baseURL = API_URL
const APIService = {
    get: async function(route, params) {
        let data = {}
        let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")}
        await axios.get(`${baseURL}${route}`, {
            params: params,
            headers: headers
          })
          .then(function (response) {
            data = response.data
          })
          .catch(function (error) {
            console.log(error);
          })
          .then(function () {
            // always executed
          });
        return data
    }, 
    post: async function(route, body) {
      let data = {}
      let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")}
      await axios.post(`${baseURL}${route}`, body, headers)
      .then(function (response) {
        data = response
      })
      .catch(function (error) {
        console.log(error);
      });
      return data
    },
    put: async function(route, body) {
      let data = {}
      let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")}
      await axios.put(`${baseURL}${route}`, body, {headers})
      .then(function (response) {
        data = response
      })
      .catch(function (error) {
        console.log(error);
      });
      return data
    },
    delete: function(route, body) {
      let data = {}
      let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")}
      axios.delete(`${baseURL}${route}`, body, headers)
      .then(function (response) {
        data = response
      })
      .catch(function (error) {
        console.log(error);
      });
      return data
    }
}

export default APIService