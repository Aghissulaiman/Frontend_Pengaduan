export interface User {
  id: number;
  username: string;
  email: string;
  fullname: string;
  phone?: string;
  avatar?: string;
  province_id?: number;
  role: 'user' | 'investigator' | 'governor' | 'admin';
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface Complaint {
  id: number;
  tracking_code: string;
  user_id: number;
  user_name: string;
  province_id: number;
  province_name: string;
  regency_id?: number;
  regency_name?: string;
  district_id?: number;
  district_name?: string;
  village_id?: number;
  village_name?: string;
  location_detail: string;
  category_id: number;
  category_name: string;
  description: string;
  photo?: string;
  status: string;
  status_text: string;
  rejected_reason?: string;
  assigned_investigator_id?: number;
  assigned_investigator_name?: string;
  investigation_result?: string;
  investigation_evidence?: string;
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: number;
  api_id: number;
  name: string;
  code?: string;
}

export interface Regency {
  id: number;
  api_id: number;
  province_id: number;
  province_name: string;
  name: string;
  type: string;
}

export interface District {
  id: number;
  api_id: number;
  regency_id: number;
  name: string;
}

export interface Village {
  id: number;
  api_id: number;
  district_id: number;
  name: string;
  postal_code?: string;
}