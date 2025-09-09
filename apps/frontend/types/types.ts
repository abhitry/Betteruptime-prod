export interface Website {
  id: string;
  url: string;
  status: 'up' | 'down' | 'checking';
  lastChecked: string;
  responseTime?: number;
}

export interface DashboardStats {
  totalSites: number;
  sitesUp: number;
  sitesDown: number
}

export interface NewWebsite {
  name: string;
  url: string;
}

export interface WebsiteTick {
  id: string;
  response_time_ms: number;
  status: 'Up' | 'Down' | 'Unknown';
  regionId: string;
  websiteId: string;
  createdAt: Date;
  region?: {
    id: string;
    name: string;
  };
}