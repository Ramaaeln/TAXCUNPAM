import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const isAdmin = window.location.pathname.startsWith("/admin");
    const token = isAdmin 
      ? localStorage.getItem("adminToken") 
      : localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;

      if (currentPath.startsWith("/admin")) {
        if (currentPath !== "/admin" && currentPath !== "/admin/") {
          localStorage.removeItem("adminToken");
          window.location.href = "/admin";
        }
      } 
      else {
        if (currentPath === "/quiz" || currentPath === "/quiz/") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("quizId");
          sessionStorage.clear();
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;