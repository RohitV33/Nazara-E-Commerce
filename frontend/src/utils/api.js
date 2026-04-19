import axios from "axios";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


export const productAPI = {
  /**
   * Get all products with optional filters + search
   * @param {object} params - { search, category, minPrice, maxPrice, sort, page, limit, mode }
   *   mode: "normal" | "smart"  — backend can use this hint for advanced search
   */
  getAll: (params = {}) => api.get("/products", { params }),

  getById: (id) => api.get(`/products/${id}`),


  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),

  
  getSuggestions: (query, mode = "smart") =>
    api.get("/products/suggestions", { params: { q: query, mode } }),
};


export const orderAPI = {
  create: (orderData) => api.post("/orders", orderData),

  getMyOrders: () => api.get("/orders/mine"),

  getById: (id) => api.get(`/orders/${id}`),

  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),

  // Admin
  getAll: (params = {}) => api.get("/orders", { params }),

  /**
   * Update order status (Admin)
   * @param {string} id
   * @param {string} status - pending | dispatched | out_for_delivery | delivered | cancelled
   */
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};


export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  logout: () => api.post("/auth/logout"),
};


export const cartAPI = {
  get: () => api.get("/cart"),
  add: (item) => api.post("/cart", item),
  update: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
};

export default api;