import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ============================================
// TYPES
// ============================================

// Auth Types
interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullname: string;
  phone?: string;
  province_api_id?: number;
}

interface LoginData {
  username: string;
  password: string;
}

interface GoogleLoginData {
  google_id: string;
  email: string;
  fullname: string;
  avatar?: string;
  province_api_id?: number;
}

// Complaint Types
interface SubmitComplaintData {
  province_api_id: number;
  regency_id?: number;
  district_id?: number;
  village_id?: number;
  location_detail: string;
  category_id: number;
  description: string;
  photo?: string;
}

interface ProcessReportData {
  process_photos?: string;
  process_notes?: string;
  process_date?: string;
}

interface CompletionReportData {
  final_photos?: string;
  completion_date: string;
  cost?: number;
  cost_details?: string;
  work_details?: string;
}

interface InvestigationResultData {
  result: string;
  evidence?: string;
  is_valid: boolean;
}

// Query Params
interface GetAllComplaintsParams {
  status?: string;
  province_api_id?: number;
  page?: number;
  limit?: number;
}

// ============================================
// AXIOS INSTANCE
// ============================================

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor dengan tipe yang benar
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// AUTH API
// ============================================

export const authApi = {
  register: (data: RegisterData): Promise<AxiosResponse> => api.post('/auth/register', data),
  login: (data: LoginData): Promise<AxiosResponse> => api.post('/auth/login', data),
  googleLogin: (data: GoogleLoginData): Promise<AxiosResponse> => api.post('/auth/google', data),
  getProfile: (): Promise<AxiosResponse> => api.get('/users/profile'),
};

// ============================================
// PROVINCE API
// ============================================

export const provinceApi = {
  getAll: (): Promise<AxiosResponse> => api.get('/provinces'),
  getRegencies: (provinceId: number): Promise<AxiosResponse> => api.get(`/provinces/${provinceId}/regencies`),
  getDistricts: (regencyId: number): Promise<AxiosResponse> => api.get(`/regencies/${regencyId}/districts`),
  getVillages: (districtId: number): Promise<AxiosResponse> => api.get(`/districts/${districtId}/villages`),
};

// ============================================
// COMPLAINT API
// ============================================

export const complaintApi = {
  // Public / User
  getCategories: (): Promise<AxiosResponse> => api.get('/complaints/categories'),
  submit: (data: SubmitComplaintData): Promise<AxiosResponse> => api.post('/complaints/submit', data),
  getMy: (): Promise<AxiosResponse> => api.get('/complaints/my'),
  getById: (id: number): Promise<AxiosResponse> => api.get(`/complaints/${id}`),
  getStatus: (code: string): Promise<AxiosResponse> => api.get(`/complaints/status/${code}`),
  getAll: (params?: GetAllComplaintsParams): Promise<AxiosResponse> => api.get('/complaints/all', { params }),
  
  // Governor Only
  assignInvestigator: (id: number, investigatorId: number): Promise<AxiosResponse> => 
    api.post(`/governor/complaints/${id}/assign`, { investigator_id: investigatorId }),
  submitProcessReport: (id: number, data: ProcessReportData): Promise<AxiosResponse> => 
    api.post(`/governor/complaints/${id}/process-report`, data),
  submitCompletionReport: (id: number, data: CompletionReportData): Promise<AxiosResponse> => 
    api.post(`/governor/complaints/${id}/completion-report`, data),
  
  // Investigator Only
  submitResult: (id: number, data: InvestigationResultData): Promise<AxiosResponse> => 
    api.post(`/investigator/complaints/${id}/result`, data),
  
  // Admin Only
  getDashboard: (): Promise<AxiosResponse> => api.get('/admin/dashboard'),
};

export default api;