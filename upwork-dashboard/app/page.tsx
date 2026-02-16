/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        alert("Upwork Connection Request Sent! Scraper will now attempt auto-login.");
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Error connecting Upwork");
    }
  };

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const currentJobs = jobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans antialiased">
      
      {/* 1. Side Navigation */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-800 bg-[#0B1120] lg:flex">
        <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-800/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-500/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-lg font-black tracking-tighter uppercase">Job<span className="text-emerald-500">Pulse</span></span>
        </div>

        <nav className="flex-1 p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-emerald-400 font-bold border border-emerald-500/20">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            Live Job Feed
          </div>

          {/* CONNECT BUTTON */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-white font-bold transition-all border border-slate-700"
          >
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            Connect Upwork
          </button>
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
              <button onClick={fetchJobs} className="p-3 hover:bg-slate-800 rounded-xl transition-all">
                <svg className={`h-5 w-5 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </header>

          <div className="space-y-4">
            {currentJobs.map((job) => (
              <div key={job.job_id} className="group rounded-2xl border border-slate-800 bg-[#0B1120] p-6 transition-all hover:border-emerald-500/50">
                <a href={job.job_url} target="_blank" className="text-xl font-bold text-slate-100 hover:text-emerald-400 block mb-2">{job.job_title}</a>
                <p className="text-slate-400 text-sm line-clamp-2">{job.job_description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50 text-[11px] font-bold text-slate-500 uppercase">
                  <div className="flex gap-6">
                    <span>⏱ {job.posted_date}</span>
                    <span>📬 {job.job_proposals} Proposals</span>
                  </div>
                  <a href={job.job_url} target="_blank" className="text-emerald-500 hover:text-emerald-400">DETAILS →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* LOGIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0B1120] border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Connect Upwork</h2>
            <p className="text-slate-400 text-sm mb-6">Enter credentials to start the cloud scraper.</p>
            <form onSubmit={handleConnect} className="space-y-4">
              <input 
                type="email" placeholder="Upwork Email" required
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none focus:border-emerald-500"
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              />
              <input 
                type="password" placeholder="Upwork Password" required
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:outline-none focus:border-emerald-500"
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-4 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 p-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20">Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}