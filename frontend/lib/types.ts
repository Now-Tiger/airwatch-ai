export interface ComplaintLocation {
  lat: number;
  lng: number;
  area: string;
}

export interface ComplaintEntities {
  pollution_source: string | null;
  landmark: string | null;
  time_reference: string | null;
  quantities: string[];
}

export interface ComplaintPayload {
  text: string;
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  photo_url?: string | null;
  channel: string;
  submitted_at: string;
}

export interface ComplaintResponseData {
  id: string;
  category: string;
  sub_category: string | null;
  priority_score: number;
  priority_tier: 'P1' | 'P2' | 'P3' | 'P4';
  is_urgent: boolean;
  sentiment_label: string;
  entities: ComplaintEntities;
  ai_source: string;
  processing_status: string;
  is_duplicate: boolean;
  parent_complaint_id: string | null;
  corroboration_count: number;
  ticket_id: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface Ticket {
  id: string;
  complaint_id: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Escalated' | 'in_progress' | string;
  priority_tier: 'P1' | 'P2' | 'P3' | 'P4' | 'p1' | 'p2' | 'p3' | 'p4'; 
  category: string;
  current_tier: number;
  assigned_officer_name: string;
  assigned_officer_contact: string;
  sla_deadline: string;
  created_at: string;
}

export interface HotspotBucket {
  category: string;
  area: string;
  time_bucket: string;
  complaint_count: number;
  urgent_count: number;
  avg_priority_score: number;
}

export interface HotspotResponseData {
  buckets: HotspotBucket[];
  generated_at: string;
}

export interface EscalationMatrixRule {
  category: string;
  tier: number;
  officer_name: string;
  officer_contact: string;
}

export interface AnalyticsData {
  summary: {
    total_complaints: number;
    urgent_complaints: number;
    avg_priority_score: number;
  };
  top_hotspots: Array<{
    area: string;
    complaints: number;
    urgent: number;
    lat: number,
    lng: number,
  }>;
  category_breakdown: Array<{
    category: string;
    complaints: number;
  }>;
  timeline: Array<{
    time_bucket: string;
    complaints: number;
    urgent: number;
  }>;
  generated_at: string;
}

// Add this wrapper interface to represent the top-level API JSON structure
export interface AnalyticsApiResponse {
  success: boolean;
  data: AnalyticsData;
  error: string | null;
}
