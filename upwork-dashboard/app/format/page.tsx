/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Individual Sortable Item Component ---
function SortableSection({ id, s, index, updateSection, removeSection, saveSingle }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id });
  const [isSaving, setIsSaving] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleLocalSave = async () => {
    setIsSaving(true);
    await saveSingle(index);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div ref={setNodeRef} style={style} className={`group bg-[#0B1120] border ${isDragging ? 'border-emerald-500 shadow-2xl' : 'border-slate-800/60'} p-8 rounded-[3rem] flex flex-col gap-6 transition-all duration-300 mb-6`}>
      
      <div className="flex items-start gap-6">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-4 bg-slate-900 rounded-2xl text-slate-600 hover:text-emerald-500 transition-colors shadow-inner">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8h16M4 16h16" /></svg>
        </div>
        
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 ml-1">Section Heading</label>
              <input 
                className="w-full bg-transparent border-b border-slate-800 py-2 text-2xl font-black text-white outline-none focus:border-emerald-500 transition-all"
                value={s.section_name}
                onChange={(e) => updateSection(index, 'section_name', e.target.value)}
              />
            </div>
            <button onClick={() => removeSection(s.id, index)} className="p-3 text-slate-800 hover:text-red-500 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 ml-1">AI Logic Instructions</label>
            <textarea 
              className="w-full bg-slate-900/40 border border-slate-800/50 rounded-[2rem] p-6 text-slate-300 text-base outline-none focus:border-emerald-500/50 min-h-[120px] transition-all resize-y leading-relaxed"
              value={s.section_instruction}
              onChange={(e) => updateSection(index, 'section_instruction', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Individual Save Button */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={handleLocalSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-500 hover:bg-emerald-600 hover:text-white'}`}
        >
          {isSaving ? "Saved! ✓" : "Save This Section"}
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function FormatPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => { fetchFormat(); }, []);

  const fetchFormat = async () => {
    const res = await fetch("/api/format");
    const data = await res.json();
    setSections(data);
    setLoading(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Auto-save new order
        saveBulk(newOrder);
        return newOrder;
      });
    }
  };

  const updateSection = (index: number, field: string, value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const saveSingleSection = async (index: number) => {
    const section = sections[index];
    await fetch("/api/format", {
      method: "POST",
      body: JSON.stringify({ ...section, order_index: index + 1 }),
    });
  };

  const saveBulk = async (data: any[]) => {
    const formatted = data.map((s, i) => ({ ...s, order_index: i + 1 }));
    await fetch("/api/format", { method: "POST", body: JSON.stringify(formatted) });
  };

  const addSection = async () => {
    setLoading(true);
    const newBlock = { section_name: "New Section", section_instruction: "", order_index: sections.length + 1 };
    const res = await fetch("/api/format", { method: "POST", body: JSON.stringify(newBlock) });
    if (res.ok) await fetchFormat();
    setLoading(false);
  };

  const removeSection = async (dbId: any, index: number) => {
    if (!confirm("Delete permanently?")) return;
    setSections(sections.filter((_, i) => i !== index));
    await fetch(`/api/format?id=${dbId}`, { method: "DELETE" });
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans antialiased">
      <Sidebar />
      <main className="flex-1 p-4 lg:ml-72 lg:p-12">
        <div className="mx-auto max-w-5xl">
          <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">AI Logic Configuration</span>
              <h1 className="text-7xl font-black text-white tracking-tighter leading-none mt-4">Structure</h1>
            </div>
          </header>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sections.map((s, i) => (
                  <SortableSection 
                    key={s.id} 
                    id={s.id} 
                    s={s} 
                    index={i} 
                    updateSection={updateSection} 
                    removeSection={removeSection}
                    saveSingle={saveSingleSection}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button onClick={addSection} disabled={loading} className="w-full mt-10 py-12 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-600 font-black hover:border-emerald-500/50 hover:text-emerald-500 transition-all uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 group">
            <div className="p-3 bg-slate-900 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            </div>
            {loading ? "Syncing..." : "Add New Logic Block"}
          </button>
        </div>
      </main>
    </div>
  );
}