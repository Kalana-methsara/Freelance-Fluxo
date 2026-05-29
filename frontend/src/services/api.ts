// import axios from "axios";
// import { STORAGE_KEYS } from "../utils/storageKeys";

// // const api = axios.create({
// //   baseURL: "http://localhost:5000/api/v1",
// //   headers: {
// //     "Content-Type": "application/json",
// //   },
// // });
// const api = axios.create({
//   baseURL: "https://complete-backend-react.vercel.app" 
// });

// const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem(STORAGE_KEYS.accessToken);
//     const isPublic = PUBLIC_ENDPOINTS.some((url) => config.url?.includes(url));

//     if (!isPublic && token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // api.interceptors.response.use(
// //   (response) => response,
// //   async (error) => {
// //     const originalRequest = error.config;

// //     if (error.response?.status === 401 && !originalRequest._retry) {
// //       originalRequest._retry = true;

// //       try {
// //         return api(originalRequest);
// //       } catch {
// //         localStorage.removeItem(STORAGE_KEYS.accessToken);
// //         localStorage.removeItem(STORAGE_KEYS.refreshToken);
// //         localStorage.removeItem(STORAGE_KEYS.user);
// //         window.location.href = "/login";
// //       }
// //     }
// //     return Promise.reject(error);
// //   },
// // );

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // 401 error එකක් සහ මේක තවම retry කරලා නැත්නම්
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // 1. Refresh Token එක පාවිච්චි කරලා අලුත් Access Token එකක් ලබාගන්න
//         const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
//         // const { data } = await axios.post("http://localhost:5000/api/v1/auth/refresh", {
//         //   refreshToken,
//         // });
//         const { data } = await api.post("/api/v1/auth/refresh", {
//   refreshToken,
// });

//         // 2. අලුත් token එක storage එකේ save කරන්න
//         localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);

//         // 3. Header එක update කරලා request එක ආපහු යවන්න
//         originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
//         return api(originalRequest);
        
//       } catch (refreshError) {
//         // Refresh token එකත් expire නම් හෝ අසාර්ථක නම් - logout කරන්න
//         localStorage.clear();
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from "axios";
import { STORAGE_KEYS } from "../utils/storageKeys";

const api = axios.create({
  baseURL: "https://complete-backend-react.vercel.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (token && !PUBLIC_ENDPOINTS.some((url) => config.url?.includes(url))) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
        const { data } = await api.post("/auth/refresh", { refreshToken });
        localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;