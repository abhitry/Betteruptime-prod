import React, { useState ,useEffect} from 'react';
import { Globe, CheckCircle, XCircle, TrendingUp, Search, Filter, RefreshCw, Plus } from 'lucide-react';
import {Website, DashboardStats } from '@/types/types';
import { WebsiteTable } from './WebsiteTable';
import { StatsCards } from './StatsCard'; 
import { AddWebsiteModal } from './AddWebsiteModel'; 
import { BACKEND_URL } from '@/lib/utils';
import axios from 'axios';
import { useRouter } from "next/navigation"; // Next.js 13+ (app router)
import { LogOut } from "lucide-react";

// Mock data
const mockWebsites: Website[] = [
  
];

export function Dashboard() {
  const [websites, setWebsites] = useState<Website[]>(mockWebsites);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'checking'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);  // 🔥 NEW
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const stats: DashboardStats = {
    totalSites: websites.length,
    sitesUp: websites.filter(w => w.status === 'up').length,
    sitesDown: websites.filter(w => w.status === 'down').length,
  };

  const filteredWebsites = websites.filter(website => {
    const matchesSearch =  website.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || website.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAddWebsite =async (newWebsite: { url: string }) => {
    const website: Website = {
      id: Date.now().toString(),
      url:newWebsite.url,
      status: 'checking',
      responseTime:0,
      lastChecked:'Checking ...',
    };
    setWebsites([...websites, website]);
    setIsAddModalOpen(false);
    await axios.post(`${BACKEND_URL}/website`,{
        url:newWebsite.url
    },{
        headers:{
            Authorization:localStorage.getItem("token")
        }
    })

    await fetchData();
  };


   
    async function  fetchData()
    {
        const response =await  axios.get(`${BACKEND_URL}/websites`, {
        headers: {
            Authorization: localStorage.getItem("token"),
        }
        })
        setWebsites(response.data.websites.map((w: any) => ({
            id: w.id,
            url: w.url,
            status: w.ticks[0] ? (w.ticks[0].status === "Up" ? "up" : "down") : "checking",
            responseTime: w.ticks[0] ? w.ticks[0].response_time_ms : 0,
            lastChecked: w.ticks[0] ? w.ticks[0].createdAt : new Date().toLocaleString()
        })))
        setLastRefresh(new Date());
    }

    useEffect(() => {
      // Fetch immediately
      fetchData();

      // Set up interval to fetch data every 5 seconds
      const interval = setInterval(() => {
        fetchData();
      }, 60000); // 60000ms = 60 seconds

      // Clean up interval on component unmount
      return () => clearInterval(interval);
    }, []);

    // 🔥 NEW: cooldown timer effect
    useEffect(() => {
      if (cooldown > 0) {
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
      }
    }, [cooldown]);

        // 🔥 UPDATED: handleRefresh with cooldown
    const handleRefresh = async () => {
      await fetchData();
      setCooldown(20); // start 20s cooldown
    };


  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white">BetterUptime</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem("token"); // clear token
                  router.push("/signin"); // redirect to login page
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-white-600 sm:bg-transparent text-white rounded-md cursor-pointer transition-colors flex items-center justify-center hover:bg-red-500/10 sm:hover:bg-white/10"title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search websites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`pl-10 pr-8 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none  `}
              >
                <option value="all">All Status</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="checking">Checking</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
              {/* 🔥 UPDATED Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={cooldown > 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                cooldown > 0
                  ? 'bg-gray-500 cursor-not-allowed border-gray-600 text-gray-300'
                  : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white cursor-pointer'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              {cooldown > 0 ? `Wait ${cooldown}s` : 'Refresh'}
            </button>
           
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Website
            </button>
          </div>
        </div>

        {/* Websites Table */}
        <WebsiteTable websites={filteredWebsites} lastRefresh={lastRefresh} />
      </div>

      {/* Add Website Modal */}
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWebsite}
      />
    </div>
  );
}