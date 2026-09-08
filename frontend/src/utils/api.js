import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "/api",
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    // Memeriksa apakah Authorization header sudah diset manual (case-insensitive check)
    const existingAuth =
      config.headers?.Authorization ||
      config.headers?.authorization ||
      (typeof config.headers?.get === "function" && config.headers.get("Authorization"));

    if (!existingAuth) {
      const isAdmin = window.location.pathname.startsWith("/utcbt-internal");
      const token = isAdmin
        ? localStorage.getItem("adminToken")
        : localStorage.getItem("accessToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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

      if (currentPath.startsWith("/utcbt-internal")) {
        if (
          currentPath !== "/utcbt-internal" &&
          currentPath !== "/utcbt-internal/"
        ) {
          localStorage.removeItem("adminToken");
          window.location.href = "/utcbt-internal";
        }
      } else {
        // PENTING: Hanya tendang ke Home jika user sedang aktif di route pengerjaan /quiz.
        // Halaman /result atau / tidak akan kena paksa redirect reload.
        if (currentPath.startsWith("/quiz") && currentPath !== "/result") {
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
