export interface TrafficConfig {
  target_url: string;
  total_sessions: number;
  max_concurrent: number;
  headless: boolean;
  proxy_file?: string;
  returning_visitor_rate: number;
  navigation_timeout: number;
  max_retries_per_session: number;
  personas: Persona[];
  gender_distribution: Record<string, number>;
  device_distribution: Record<string, number>;
  country_distribution: Record<string, number>;
  age_distribution: Record<string, number>;
  referrer_sources: string[];
  session_duration_range: [number, number];
  bounce_rate_target: number;
  user_agent_strategy: string;
  network_type: string;
  mode_type: string;
  schedule_time?: string;
  enable_random_personas: boolean;
  random_persona_count: number;
  enable_geolocation_simulation: boolean;
  enable_language_detection: boolean;
}

export interface Persona {
  name: string;
  goal_keywords: Record<string, number>;
  generic_keywords: Record<string, number>;
  navigation_depth: [number, number];
  avg_time_per_page: [number, number];
  gender: string;
  age_range: [number, number];
  can_fill_forms: boolean;
  goal?: PersonaGoal;
  scroll_probability: number;
  form_interaction_probability: number;
  country_preference?: string;
  language_preference?: string;
}

export interface PersonaGoal {
  type: 'collect_web_vitals' | 'find_and_click' | 'fill_form';
  target_text?: string;
  target_selector?: string;
  pages_to_visit?: number;
  min_vitals_to_collect?: number;
  case_sensitive?: boolean;
}

export interface SessionStats {
  total: number;
  successful: number;
  failed: number;
  completed: number;
  total_duration: number;
  average_duration?: number;
  success_rate?: number;
}

export interface LiveSessionUpdate {
  status: 'successful' | 'failed';
  duration: number;
  persona: string;
  device_type: string;
  visitor_type: string;
  gender: string;
  age_range: string;
  country: string;
  goal_result?: any;
}

export interface WebVitals {
  url: string;
  ttfb: number;
  fcp: number;
  domLoad: number;
  pageLoad: number;
  timestamp?: number;
}

export interface AnalyticsData {
  sessions: SessionStats;
  personas: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  ages: Record<string, number>;
  genders: Record<string, number>;
  web_vitals: WebVitals[];
  hourly_distribution: Record<string, number>;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: Partial<TrafficConfig>;
  created_at: string;
  updated_at: string;
}

export interface SimulationRun {
  id: string;
  name: string;
  config: TrafficConfig;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  started_at: string;
  completed_at?: string;
  stats: SessionStats;
  analytics: AnalyticsData;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  session_id?: string;
}

export interface HeatmapData {
  x: number;
  y: number;
  value: number;
  element?: string;
  action?: string;
}

export interface CountryData {
  name: string;
  code: string;
  flag: string;
  weight: number;
  timezone: string[];
  locale: string[];
}

export interface DeviceFingerprint {
  device_name: string;
  user_agent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezone_id: string;
  is_mobile: boolean;
  has_touch: boolean;
  device_scale_factor: number;
  color_scheme: string;
  reduced_motion: string;
  hardware_concurrency: number;
  device_memory: number;
  country?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}