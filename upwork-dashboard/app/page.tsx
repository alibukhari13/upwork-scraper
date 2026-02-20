/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import ProposalModal from "@/components/ProposalModal";
import Link from "next/link";

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const jobsPerPage = 8;

  const fetchJobs = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/jobs?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (err) { console.log("Sync Error"); }
    finally { setTimeout(() => setIsSyncing(false), 800); }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleIgnore = async (jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
    try {
      await fetch(`/api/jobs?id=${jobId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete failed:", err);
      fetchJobs();
    }
  };

  const toggleDescription = (jobId: string) => {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const currentJobs = jobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);
  const totalPages = Math.ceil(jobs.length / jobsPerPage);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans antialiased text-[14px]">
      
      {/* AI MODAL OVERLAY */}
      {selectedJob && <ProposalModal job={selectedJob} onClose={() => setSelectedJob(null)} />}

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-slate-800/60 bg-[#0B1120] lg:flex shadow-2xl z-40">
        <div className="flex h-24 items-center gap-4 px-8 border-b border-slate-800/50">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20 rotate-3">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase text-white">Job<span className="text-emerald-500">Pulse</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 px-5 py-4 text-emerald-400 font-bold border border-emerald-500/20 shadow-inner">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            Live Monitor
          </div>
          <Link href="/history" className="flex items-center gap-3 rounded-2xl px-5 py-4 text-slate-400 hover:bg-slate-800 transition-all font-bold">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            AI History
          </Link>
        </nav>
        <div className="p-8 border-t border-slate-800/50 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800`}>
              <div className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isSyncing ? 'Syncing' : 'System Live'}</span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:ml-72 lg:p-12">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-10 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Upwork Deep Scrape</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight leading-none">Recent Feed</h1>
            </div>
            <div className="flex items-center gap-6 bg-[#0B1120] p-3 rounded-[2.5rem] border border-slate-800 shadow-2xl">
              <div className="px-8 py-2 text-center border-r border-slate-800">
                <p className="text-3xl font-black text-white leading-none">{jobs.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 mt-2 tracking-widest">Jobs Found</p>
              </div>
              <button onClick={fetchJobs} className="p-4 hover:bg-slate-800 rounded-full transition-all active:scale-90 group">
                <svg className={`h-6 w-6 text-slate-400 group-hover:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </header>

          <div className="space-y-8">
            {currentJobs.map((job) => {
              const isExpanded = expandedJobs[job.job_id];
              const isNew = job.posted_date?.toLowerCase().includes('second') || job.posted_date?.toLowerCase().includes('minute');

              return (
                <div key={job.job_id} className="group relative rounded-[2.5rem] border border-slate-800/80 bg-[#0B1120] p-10 transition-all hover:border-emerald-500/40 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-3">
                        {isNew && currentPage === 1 && <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse">NEW ARRIVAL</span>}
                        {job.is_verified === "Verified" ? (
                          <span className="flex items-center gap-1 bg-blue-600/20 text-blue-400 text-[9px] font-black px-3 py-1 rounded-lg border border-blue-500/20 tracking-tighter uppercase">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Verified
                          </span>
                        ) : (
                          <span className="bg-red-900/20 text-red-400 text-[9px] font-black px-3 py-1 rounded-lg border border-red-500/20 tracking-tighter uppercase">Unverified</span>
                        )}
                        <span className="bg-slate-800/50 text-slate-400 text-[9px] font-bold px-3 py-1 rounded-lg tracking-widest uppercase border border-slate-700/50">{job.client_location}</span>
                        <span className="bg-purple-500/10 text-purple-400 text-[9px] font-bold px-3 py-1 rounded-lg border border-purple-500/20 uppercase tracking-widest">{job.experience_level}</span>
                      </div>
                      <button onClick={() => handleIgnore(job.job_id)} className="flex items-center gap-2 text-slate-600 hover:text-red-400 transition-all group/btn">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">Ignore</span>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    <a href={job.job_url} target="_blank" className="text-3xl font-black text-white hover:text-emerald-400 transition-colors leading-[1.1] tracking-tight">{job.job_title}</a>
                    
                    <div className="flex flex-wrap gap-2">
                      {job.job_tags?.split(',').map((tag: string, i: number) => (
                        <span key={i} className="bg-slate-900 text-slate-400 text-[10px] font-bold px-4 py-1.5 rounded-xl border border-slate-800 transition-colors">{tag.trim()}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Budget / Rate</span>
                        <span className="text-sm font-bold text-emerald-500">{job.budget}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Duration</span>
                        <span className="text-sm font-bold text-slate-200">{job.project_duration}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Proposals</span>
                        <span className="text-sm font-bold text-slate-200">{job.job_proposals}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Posted</span>
                        <span className="text-sm font-bold text-slate-200">{job.posted_date}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <p className={`text-slate-400 text-base leading-relaxed font-medium italic ${!isExpanded ? 'line-clamp-3' : ''}`}>{job.job_description}</p>
                      {job.job_description?.length > 200 && (
                        <button onClick={() => toggleDescription(job.job_id)} className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.2em] mt-4 hover:text-emerald-400 transition-all flex items-center gap-2">
                          {isExpanded ? "↑ Collapse Details" : "↓ Expand Full Description"}
                        </button>
                      )}
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Client Spent:</span>
                        <span className="text-[10px] font-bold text-slate-400">{job.client_spent}</span>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setSelectedJob(job)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black transition-all shadow-xl shadow-blue-900/20 active:scale-95 uppercase tracking-widest"
                        >
                          Generate Proposal ✨
                        </button>
                        <a href={job.job_url} target="_blank" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black transition-all active:scale-95 uppercase tracking-widest">Apply on Upwork</a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-20 flex items-center justify-center gap-4 pb-20">
              <button disabled={currentPage === 1} onClick={() => {setCurrentPage(currentPage - 1); window.scrollTo({top:0, behavior:'smooth'})}} className="h-14 w-14 flex items-center justify-center rounded-2xl border border-slate-800 bg-[#0B1120] text-slate-400 hover:border-emerald-500 transition-all disabled:opacity-10">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="px-10 h-14 flex items-center rounded-2xl border border-slate-800 bg-[#0B1120] text-xs font-black text-slate-400 uppercase tracking-widest">
                Page <span className="text-white mx-2 text-lg">{currentPage}</span> of {totalPages}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => {setCurrentPage(currentPage + 1); window.scrollTo({top:0, behavior:'smooth'})}} className="h-14 w-14 flex items-center justify-center rounded-2xl border border-slate-800 bg-[#0B1120] text-slate-400 hover:border-emerald-500 transition-all disabled:opacity-10">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}