import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach auth token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("archive_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("archive_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const register = (data: { email: string; username: string; password: string; full_name?: string }) =>
  api.post("/auth/register", data).then((r) => r.data);

// Missionaries
export const getMissionaries = () => api.get("/missionaries").then((r) => r.data);
export const createMissionary = (data: object) => api.post("/missionaries", data).then((r) => r.data);

// Genres
export const getGenres = () => api.get("/genres").then((r) => r.data);
export const seedGenres = () => api.post("/genres/seed").then((r) => r.data);

// Documents
export const getDocuments = (params?: object) => api.get("/documents", { params }).then((r) => r.data);
export const getDocument = (id: string) => api.get(`/documents/${id}`).then((r) => r.data);
export const createDocument = (data: object) => api.post("/documents", data).then((r) => r.data);
export const updateDocument = (id: string, data: object) => api.put(`/documents/${id}`, data).then((r) => r.data);
export const deleteDocument = (id: string) => api.delete(`/documents/${id}`);

export const uploadImages = (docId: string, files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return api.post(`/documents/${docId}/images`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// OCR
export const getOCREngines = () => api.get("/ocr/engines").then((r) => r.data);
export const startOCR = (docId: string, data: object) => api.post(`/ocr/start/${docId}`, data).then((r) => r.data);
export const getOCRJob = (jobId: string) => api.get(`/ocr/status/${jobId}`).then((r) => r.data);
export const getDocumentJobs = (docId: string) => api.get(`/ocr/jobs/${docId}`).then((r) => r.data);

// Transcriptions
export const getDocumentTranscriptions = (docId: string) =>
  api.get(`/transcriptions/document/${docId}`).then((r) => r.data);
export const updateTranscription = (id: string, data: object) =>
  api.put(`/transcriptions/${id}`, data).then((r) => r.data);
export const getTranscriptionVersions = (id: string) =>
  api.get(`/transcriptions/${id}/versions`).then((r) => r.data);

// Search
export const search = (params: object) => api.get("/search", { params }).then((r) => r.data);
export const getStats = () => api.get("/search/stats").then((r) => r.data);

// Export
export const exportDocument = (docId: string, format: string) =>
  api.get(`/export/${docId}/${format}`, { responseType: "blob" });
