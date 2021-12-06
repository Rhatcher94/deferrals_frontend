import axios from "axios"
const baseURL = API_URL
const APIService = {
    get: function(route, params) {
        let data = {}
        axios.get(`${baseURL}${route}`, {
            params: params
          })
          .then(function (response) {
            data = response
            console.log(response);
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
      let headers = {}
      await axios.post(`${baseURL}${route}`, body, headers)
      .then(function (response) {
        data = response
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
      return data
    },
    put: function(route, body) {
      let data = {}
      let headers = {}
      axios.put(`${baseURL}${route}`, body, headers)
      .then(function (response) {
        data = response
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
      return data
    },
    delete: function(route, body) {
      let data = {}
      let headers = {}
      axios.delete(`${baseURL}${route}`, body, headers)
      .then(function (response) {
        data = response
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
      return data
    }
}

export default APIService