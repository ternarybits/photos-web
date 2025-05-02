"server-only";

import Photos from "photos";

// Initialize the shared Photos SDK client
const photosClient = new Photos({
  apiKey: process.env.API_KEY || "dummy-api-key",
  baseURL: process.env.API_BASE_URL || "http://localhost:8000",
  logLevel: "info",
});

export default photosClient;
