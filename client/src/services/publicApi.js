import axios from "axios";
import { getApiBaseUrl } from "../utils/apiOrigin";

const publicApi = axios.create({
  baseURL: getApiBaseUrl(),
});

export default publicApi;
