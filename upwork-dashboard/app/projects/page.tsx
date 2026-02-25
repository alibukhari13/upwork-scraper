/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjects, setNewProjects] = useState([{ project_name: "", project_link: "", project_description: "" }]);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
  };

  const addFormFields = () => {
    setNewProjects([...newProjects, { project_name: "", project_link: "", project_description: "" }]);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const updated = [...newProjects];
    (updated[index] as any)[field] = value;
    setNewProjects(updated);
  };

  const saveNewProjects = async () => {
    const validProjects = newProjects.filter(p => p.project_name.trim());
    if (validProjects.length === 0) return alert("Please enter at least one project name.");
    setLoading(true);
    await fetch("/api/projects", { method: "POST", body: JSON.stringify(validProjects) });
    setNewProjects([{ project_name: "", project_link: "", project_description: "" }]);
    fetchProjects();
    setLoading(false);
    alert("Portfolio Updated! 🚀");
  };

  const updateProject = async () => {
    setLoading(true);
    await fetch("/api/projects", { method: "POST", body: JSON.stringify(editingProject) });
    setEditingProject(null);
    fetchProjects();
    setLoading(false);
    alert("Project Updated! ✅");
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans antialiased text-[14px]">
      {editingProject && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0B1120] border border-slate-800 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black mb-8 text-white">Edit Project</h2>
            <div className="space-y-6">
              <input className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:border-emerald-500" value={editingProject.project_name} onChange={(e) => setEditingProject({...editingProject, project_name: e.target.value})} />
              <input className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:border-emerald-500" value={editingProject.project_link} onChange={(e) => setEditingProject({...editingProject, project_link: e.target.value})} />
              <textarea className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 h-40 outline-none focus:border-emerald-500 resize-none" value={editingProject.project_description} onChange={(e) => setEditingProject({...editingProject, project_description: e.target.value})} />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setEditingProject(null)} className="flex-1 py-4 rounded-2xl bg-slate-800 font-bold">Cancel</button>
              <button onClick={updateProject} className="flex-1 py-4 rounded-2xl bg-emerald-600 font-black">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />

      <main className="flex-1 p-4 lg:ml-72 lg:p-12">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Asset Management</span>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none mt-2">My Portfolio</h1>
          </header>

          <section className="bg-[#0B1120] border border-slate-800 p-10 rounded-[3rem] shadow-xl mb-16">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-emerald-400">Add New Projects</h2>
              <button onClick={addFormFields} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-xs font-black transition-all">+ ADD ROW</button>
            </div>
            <div className="space-y-6">
              {newProjects.map((p, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-900/40 rounded-[2rem] border border-slate-800/50">
                  <input placeholder="Project Name" className="bg-transparent border-b border-slate-800 p-3 outline-none focus:border-emerald-500 text-lg font-bold" value={p.project_name} onChange={(e) => handleInputChange(i, "project_name", e.target.value)} />
                  <input placeholder="Live Link (URL)" className="bg-transparent border-b border-slate-800 p-3 outline-none focus:border-emerald-500 text-sm text-slate-400" value={p.project_link} onChange={(e) => handleInputChange(i, "project_link", e.target.value)} />
                  <textarea placeholder="Description..." className="md:col-span-2 bg-transparent border-b border-slate-800 p-3 outline-none focus:border-emerald-500 h-24 resize-none text-sm text-slate-400" value={p.project_description} onChange={(e) => handleInputChange(i, "project_description", e.target.value)} />
                </div>
              ))}
            </div>
            <button onClick={saveNewProjects} disabled={loading} className="w-full mt-10 py-5 rounded-[1.5rem] bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all shadow-xl uppercase tracking-[0.2em]">{loading ? "Syncing..." : "Save to Portfolio"}</button>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map(p => (
              <div key={p.id} className="group bg-[#0B1120] border border-slate-800 p-10 rounded-[3rem] relative transition-all hover:border-emerald-500/30 shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-white leading-tight pr-12">{p.project_name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProject(p)} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => deleteProject(p.id)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
                <a href={p.project_link} target="_blank" className="text-emerald-500 text-xs font-black tracking-widest hover:text-emerald-400 mb-6 block truncate uppercase border-b border-emerald-500/10 pb-2 w-fit">{p.project_link || "No Link"}</a>
                <p className="text-slate-400 text-sm leading-relaxed italic line-clamp-4">{p.project_description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}