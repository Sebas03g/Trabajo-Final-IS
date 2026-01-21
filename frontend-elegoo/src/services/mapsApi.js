import axios from "axios";

const API_URL = "http://localhost:3000/api/maps";

export const saveMap = (data) => {
  return axios.post(API_URL, data);
};

export const getMap = () => {
  return axios.get(API_URL);
};
