/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function HistoryPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals?t=${Date.now()}`);
      const data = await res.json();
      setProposals(data);
    } catch (err) {
      console.error("Fetch Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposals(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this proposal?")) return;
    setProposals(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/proposals?id=${id}`, { method: "DELETE" });
  };

  const handleUpdate = async (p: any) => {
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: p.job_id,
        jobTitle: p.job_title,
        proposal_text: p.proposal_text
      }),
    });
    if (res.ok) alert("Changes Saved & AI Trained! ✅");
  };

  const updateLocalText = (id: number, newText: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, proposal_text: newText } : p));
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans antialiased text-[14px]">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #059669; }
      `}</style>

      <Sidebar />

      <main className="flex-1 p-4 lg:ml-72 lg:p-12">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-10 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Proposal Memory Bank</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight leading-none">AI History</h1>
            </div>
            <div className="bg-[#0B1120] px-8 py-4 rounded-[2rem] border border-slate-800 shadow-xl text-center">
              <p className="text-3xl font-black text-emerald-500 leading-none">{proposals.length}</p>
              <p className="text-[10px] font-bold uppercase text-slate-500 mt-2 tracking-widest">Total Drafts</p>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing with Cloud...</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {proposals.length > 0 ? proposals.map((p) => (
                <div key={p.id} className="group relative rounded-[2.5rem] border border-slate-800/80 bg-[#0B1120] p-8 transition-all hover:border-emerald-500/30 shadow-xl overflow-hidden">
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-2xl font-black text-white leading-tight line-clamp-1">{p.job_title}</h2>
                      <button onClick={() => handleDelete(p.id)} className="flex-shrink-0 p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        value={p.proposal_text}
                        onChange={(e) => updateLocalText(p.id, e.target.value)}
                        className="custom-scrollbar w-full h-56 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300 text-sm leading-relaxed focus:border-emerald-500 outline-none transition-all resize-none overflow-y-auto shadow-inner"
                      />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800/50">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Last Updated: {new Date(p.updated_at).toLocaleString()}</span>
                      <button onClick={() => handleUpdate(p)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest">Save & Train AI</button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-32 border-2 border-dashed border-slate-800 rounded-[3rem] bg-[#0B1120]/50">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No Proposals in Memory Bank</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}