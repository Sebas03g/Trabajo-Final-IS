import axios from "axios";

const API_URL = "http://localhost:3000/api/routes";

/*export const sendRouteToRobot = (routeId) => {
  return axios.post(`${API_URL}/${routeId}/execute`);
};*/

export const getRoutes = () => {
  return axios.get(API_URL);
};

export const executeRoute = (routeId) => {
  return axios.post(`${API_URL}/${routeId}/execute`);
};