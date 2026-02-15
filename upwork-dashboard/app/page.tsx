/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const jobsPerPage = 8;

  const fetchJobs = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/jobs?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (err) {
      console.log("Database Sync Error");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 40000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const currentJobs = jobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans antialiased">
      
      {/* 1. Side Navigation (Fixed) */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-800 bg-[#0B1120] lg:flex">
        <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-800/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-500/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-lg font-black tracking-tighter uppercase">Job<span className="text-emerald-500">Pulse</span></span>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-emerald-400 font-bold border border-emerald-500/20">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            Live Job Feed
          </div>
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{isSyncing ? 'Updating...' : 'System Live'}</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-4 lg:ml-64 lg:p-12">
        <div className="mx-auto max-w-4xl">
          
          {/* Header */}
          <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Recent Opportunities</h1>
              <p className="text-slate-400 text-sm mt-1">Real-time data stream from Upwork My Feed.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-[#0B1120] p-2 rounded-2xl border border-slate-800">
              <div className="px-6 py-1 text-center border-r border-slate-800">
                <p className="text-xl font-black text-white leading-none">{jobs.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 mt-1">Jobs Found</p>
              </div>
              <button 
                onClick={fetchJobs}
                className="p-3 hover:bg-slate-800 rounded-xl transition-all active:scale-90"
              >
                <svg className={`h-5 w-5 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </header>

          {/* Job Feed List */}
          <div className="space-y-4">
            {currentJobs.length > 0 ? (
              currentJobs.map((job) => {
                const isNew = job.posted_date?.toLowerCase().includes('second') || job.posted_date?.toLowerCase().includes('minute');
                
                return (
                  <div key={job.job_id} className="group relative rounded-2xl border border-slate-800 bg-[#0B1120] p-6 transition-all hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/5">
                    <div className="flex flex-col gap-4">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isNew && currentPage === 1 && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded tracking-tighter animate-pulse">LATEST</span>
                          )}
                          <span className="text-[10px] font-mono text-slate-600">ID: {job.job_id}</span>
                        </div>
                      </div>

                      <a href={job.job_url} target="_blank" className="text-xl font-bold text-slate-100 hover:text-emerald-400 transition-colors leading-snug">
                        {job.job_title}
                      </a>

                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                        {job.job_description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800/50">
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs font-bold">⏱</span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{job.posted_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs font-bold">📬</span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{job.job_proposals} Proposals</span>
                          </div>
                        </div>
                        
                        <a 
                          href={job.job_url} 
                          target="_blank" 
                          className="text-[11px] font-black text-emerald-500 hover:text-emerald-400 tracking-widest border-b-2 border-emerald-500/20 hover:border-emerald-500 transition-all"
                        >
                          DETAILS →
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-transparent p-20 text-center">
                <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Waiting for Scraper...</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => {setCurrentPage(p => p - 1); window.scrollTo(0,0)}}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-800 bg-[#0B1120] text-slate-400 hover:border-emerald-500 disabled:opacity-20 transition-all"
              >
                ←
              </button>
              
              <div className="px-6 h-10 flex items-center rounded-lg border border-slate-800 bg-[#0B1120] text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                {currentPage} / {totalPages}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => {setCurrentPage(p => p + 1); window.scrollTo(0,0)}}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-800 bg-[#0B1120] text-slate-400 hover:border-emerald-500 disabled:opacity-20 transition-all"
              >
                →
              </button>
            </div>
          )}

          <footer className="mt-20 py-10 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.6em]">Automation v3.0 | 2026</p>
          </footer>
        </div>
      </main>
    </div>
  );
}