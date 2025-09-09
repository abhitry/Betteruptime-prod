"use client";
import { BACKEND_URL } from '@/lib/utils';
import React, { useState, useEffect ,useCallback} from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { WebsiteTick } from '@/types/types';

interface StatusCheck {
  id: string;
  timestamp: string;
  status: 'up' | 'down';
  responseTime: number;
  statusCode?: number;
}

interface WebsiteData {
  id: string;
  url: string;
  userId: string;
  ticks?: WebsiteTick[];
}

export default function WebsiteDetails() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.websiteId as string;
  
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [statusChecks, setStatusChecks] = useState<StatusCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [cooldown, setCooldown] = useState(0);



  // Convert WebsiteTick to StatusCheck format
  const convertTicksToStatusChecks = (ticks: WebsiteTick[]): StatusCheck[] => {
    return ticks.map(tick => ({
      id: tick.id,
      timestamp: new Date(tick.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      status: tick.status === 'Up' ? 'up' : 'down',
      responseTime: tick.response_time_ms,
      statusCode: tick.status === 'Up' ? 200 : 500
    }));
  };

  // Fetch website data from backend
  const fetchWebsiteData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/status/${websiteId}`, {
        headers: {
          'Authorization': token
        }
      });
      
      setWebsite(response.data);
      
      // Convert ticks to status checks if available
      if (response.data.ticks && response.data.ticks.length > 0) {
        console.log('Ticks data:', response.data.ticks); // Debug log
        const checks = convertTicksToStatusChecks(response.data.ticks);
        console.log('Converted checks:', checks); // Debug log
        setStatusChecks([...checks]);
      } else {
        console.log('No ticks data received');
        setStatusChecks([]);
      }
      setLastRefresh(new Date());
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching website data:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else if (err.response?.status === 409) {
        setError('Website not found');
      } else {
        setError('Failed to load website data');
      }
    } finally {
      setIsLoading(false);
    }
  },[websiteId, router]);

  // Initial data fetch + autorefresh response time
  useEffect(() => {
    fetchWebsiteData(); // initial fetch
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        fetchWebsiteData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isLoading, isRefreshing, fetchWebsiteData]);

  // 🕒 Force UI re-render every second (without fetching again)
  const [, forceRender] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      forceRender((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Calculate statistics
  const upCount = statusChecks.filter(check => check.status === 'up').length;
  const downCount = statusChecks.filter(check => check.status === 'down').length;
  const successRate = statusChecks.length > 0 ? ((upCount / statusChecks.length) * 100).toFixed(1) : '0.0';
  const avgResponseTime = statusChecks.length > 0 
    ? Math.round(statusChecks.reduce((sum, check) => sum + check.responseTime, 0) / statusChecks.length)
    : 0;

  // Calculate uptime percentage (assuming 99.98% as default if no historical data)
  const uptimePercentage = statusChecks.length > 0 ? successRate : '99.98';

  // Get current status based on latest check
  const currentStatus = statusChecks.length > 0 ? statusChecks[0].status : 'up';
  const latestResponseTime = statusChecks.length > 0 ? statusChecks[0].responseTime : 0;

  const getLastCheckedTime = () => {
    if (!lastRefresh) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (diffSeconds < 60) return rtf.format(-diffSeconds, "second");
    if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
    if (diffHours < 24) return rtf.format(-diffHours, "hour");
    return rtf.format(-diffDays, "day");
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing || cooldown > 0) return; // prevent multiple clicks

    setIsRefreshing(true);      // start spinner
    try {
      await fetchWebsiteData(); // fetch data
      setLastRefresh(new Date());
      setCooldown(20);          // start 20s cooldown
    } finally {
      setIsRefreshing(false);   // stop spinner
    }
  };


  const handleBack = () => {
    router.push('/dashboard');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading website details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No website data
  if (!website) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Website Not Found</h2>
          <p className="text-gray-400 mb-4">The requested website could not be found.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 space-x-2 sm:space-x-4">
            
            {/* Back Button + Website ID */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm sm:text-base">Back to Dashboard</span>
              </button>
              <span className="text-gray-500 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                {website.id}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={cooldown > 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                cooldown > 0
                  ? 'bg-gray-500 cursor-not-allowed border-gray-600 text-gray-300'
                  : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-white cursor-pointer'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm sm:text-base">
                {cooldown > 0 ? `Wait ${cooldown}s` : 'Refresh'}
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Website Overview Card */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-700 w-full max-w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {currentStatus === 'up' ? (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                )}
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 break-words">
                  {website.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </h1>
                <div className="flex flex-wrap items-center space-x-2 text-gray-400 text-sm sm:text-base">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate max-w-[200px] sm:max-w-[300px] break-all">{website.url}</span>
                  <a 
                    href={website.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 hover:text-white transition-colors" />
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm mt-1">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Last checked: {getLastCheckedTime()}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            {/* <div className="grid grid-cols-4 gap-8 text-center"> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white">{uptimePercentage}%</div>
                <div className="text-gray-400 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{latestResponseTime}ms</div>
                <div className="text-gray-400 text-sm">Response Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">{upCount}</div>
                <div className="text-gray-400 text-sm">Up (Last {statusChecks.length})</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">{downCount}</div>
                <div className="text-gray-400 text-sm">Down (Last {statusChecks.length})</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Status Checks */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div  className="mb-4 sm:mb-0">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Recent Status Checks</h2>
              <p className="text-gray-400 text-sm sm:text-base">
                {statusChecks.length > 0 
                  ? `Last ${statusChecks.length} monitoring checks with response times`
                  : 'No monitoring data available yet'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full"></div>
                <span className="text-gray-400">Up</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-red-500 rounded-full"></div>
                <span className="text-gray-400">Down</span>
              </div>
            </div>
          </div>

          {statusChecks.length > 0 ? (
            <>
              {/* Timeline */}
              <div className="mb-6 sm:mb-8">
                <div className="text-gray-400 text-sm sm:text-base mb-2 sm:mb-4">Timeline:</div>
                <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                  {statusChecks.map((check, index) => (
                    <div key={check.id} className="flex flex-col items-center space-y-1 sm:space-y-2 flex-shrink-0">
                      <div 
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border-2 ${
                          check.status === 'up' 
                            ? 'bg-green-500 border-green-400' 
                            : 'bg-red-500 border-red-400'
                        }`}
                        title={`${check.timestamp} - ${check.status} - ${check.responseTime}ms`}
                      >
                        {check.status === 'up' ? (
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-4 sm:pt-6 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{successRate}%</div>
                  <div className="text-gray-400 text-sm sm:text-base">Success Rate (Last {statusChecks.length})</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{avgResponseTime}ms</div>
                  <div className="text-gray-400 text-sm sm:text-base">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{statusChecks.length}</div>
                  <div className="text-gray-400 text-sm sm:text-base">Total Checks Shown</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 sm:py-12">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">No Data Available</h3>
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                This website hasn't been monitored yet. Check back in a few minutes.
              </p>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer text-sm sm:text-base"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Checking...
                  </>
                ) : (
                  'Check Now'
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}