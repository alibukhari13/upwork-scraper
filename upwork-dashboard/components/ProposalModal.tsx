/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";

export default function ProposalModal({ job, onClose }: { job: any, onClose: () => void }) {
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      const data = await res.json();
      setProposal(data.proposal);
    } catch (err) {
      alert("AI Generation Failed!");
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async () => {
    if (!proposal) return;
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        jobId: job.job_id, 
        jobTitle: job.job_title, 
        proposalText: proposal 
      }),
    });
    if (res.ok) {
      alert("Proposal Saved & Agent Trained! ✅");
      onClose();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      
      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #10b981; border-radius: 20px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #059669; }
      `}</style>

      <div className="bg-[#0B1120] border border-slate-800 w-full max-w-6xl rounded-[3rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Job Details (Rating Removed) */}
        <div className="lg:w-1/3 p-8 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/30 overflow-y-auto custom-scroll">
          <button onClick={onClose} className="mb-6 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">✕ Close</button>
          
          <h2 className="text-2xl font-black text-white mb-6 leading-tight">{job.job_title}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.job_tags?.split(',').map((tag: string, i: number) => (
                  <span key={i} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-lg border border-emerald-500/20">{tag.trim()}</span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-2">Client & Job Info</h3>
              <div className="grid grid-cols-1 gap-3 text-[12px]">
                <div className="text-slate-400 flex justify-between border-b border-slate-800/50 pb-1">Location: <span className="text-slate-200 font-bold">{job.client_location}</span></div>
                <div className="text-slate-400 flex justify-between border-b border-slate-800/50 pb-1">Total Spent: <span className="text-slate-200 font-bold">{job.client_spent}</span></div>
                <div className="text-slate-400 flex justify-between border-b border-slate-800/50 pb-1">Payment: <span className="text-blue-400 font-bold uppercase">{job.is_verified}</span></div>
                <div className="text-slate-400 flex justify-between border-b border-slate-800/50 pb-1">Budget: <span className="text-emerald-400 font-bold">{job.budget}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2">Description</h3>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap italic">{job.job_description}</p>
            </div>
          </div>
        </div>

        {/* Right Side: AI Editor */}
        <div className="lg:w-2/3 p-8 md:p-12 flex flex-col bg-[#0B1120]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-white font-black text-2xl tracking-tight">AI Proposal Editor</h3>
              <p className="text-slate-500 text-xs font-medium italic">Focusing on: {job.job_tags?.split(',').slice(0,3).join(', ')}...</p>
            </div>
            {proposal && (
              <button onClick={copyToClipboard} className={`text-[10px] font-black px-5 py-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {copied ? "COPIED! ✅" : "COPY TEXT"}
              </button>
            )}
          </div>

          <div className="relative flex-1">
            <textarea 
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="custom-scroll w-full h-full min-h-[350px] bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 text-slate-200 text-base leading-relaxed focus:border-emerald-500 outline-none transition-all resize-none shadow-inner overflow-y-auto"
              placeholder="AI will craft a skill-focused proposal here..."
            />
            {loading && (
              <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2.5rem] z-10">
                <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">AI is analyzing skills...</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={generateAI} disabled={loading} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] transition-all active:scale-95 shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {proposal ? "REGENERATE ✨" : "GENERATE PROPOSAL ✨"}
            </button>
            <button onClick={saveToHistory} disabled={!proposal || loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white font-black py-5 rounded-[1.5rem] transition-all active:scale-95 shadow-xl shadow-emerald-900/20">
              SAVE & TRAIN 🤖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}