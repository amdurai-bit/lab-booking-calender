"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMissionaries, createMissionary } from "@/lib/api";
import type { Missionary } from "@/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatDate } from "@/lib/utils";

const SEED_MISSIONARIES = [
  { name: "Samuel Mateer", nationality: "British", mission_society: "London Missionary Society", region: "Travancore", birth_year: 1835, death_year: 1893 },
  { name: "Robert Caldwell", nationality: "British", mission_society: "London Missionary Society", region: "Tirunelveli", birth_year: 1814, death_year: 1891 },
  { name: "Henry Baker Jr.", nationality: "British", mission_society: "Church Missionary Society", region: "Travancore", birth_year: 1819, death_year: 1875 },
];

export default function MissionariesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nationality: "", mission_society: "", region: "", birth_year: "", death_year: "" });

  const { data: missionaries = [], isLoading } = useQuery<Missionary[]>({
    queryKey: ["missionaries"],
    queryFn: getMissionaries,
  });

  const createMut = useMutation({
    mutationFn: createMissionary,
    onSuccess: () => {
      toast.success("Missionary added");
      qc.invalidateQueries({ queryKey: ["missionaries"] });
      setShowForm(false);
      setForm({ name: "", nationality: "", mission_society: "", region: "", birth_year: "", death_year: "" });
    },
    onError: () => toast.error("Failed to add missionary"),
  });

  const seedMissionaries = async () => {
    for (const m of SEED_MISSIONARIES) {
      try { await createMissionary(m); } catch { /* already exists */ }
    }
    qc.invalidateQueries({ queryKey: ["missionaries"] });
    toast.success("Sample missionaries added");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      ...form,
      birth_year: form.birth_year ? Number(form.birth_year) : undefined,
      death_year: form.death_year ? Number(form.death_year) : undefined,
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-parchment-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-ink-800 font-serif">Missionaries</h1>
              <p className="text-ink-500 text-sm mt-1">{missionaries.length} in archive</p>
            </div>
            <div className="flex gap-2">
              {missionaries.length === 0 && (
                <button onClick={seedMissionaries} className="px-4 py-2 border border-parchment-300 text-ink-600 rounded text-sm hover:bg-parchment-100">
                  Add sample missionaries
                </button>
              )}
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-ink-700 text-parchment-100 rounded text-sm font-medium hover:bg-ink-600 transition-colors"
              >
                + Add Missionary
              </button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="archive-card p-5 mb-6 space-y-4">
              <h2 className="font-semibold text-ink-700 font-serif">New Missionary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink-600 mb-1">Name *</label>
                  <input required type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-800" />
                </div>
                {[
                  ["nationality", "Nationality"], ["mission_society", "Mission Society"],
                  ["region", "Region"], ["birth_year", "Birth Year"], ["death_year", "Death Year"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-ink-600 mb-1">{label}</label>
                    <input type="text" value={(form as any)[key]} onChange={(e) => setForm({...form, [key]: e.target.value})}
                      className="w-full px-3 py-2 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-800" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={createMut.isPending} className="px-4 py-2 bg-ink-700 text-parchment-100 rounded text-sm disabled:opacity-50">
                  {createMut.isPending ? "Adding…" : "Add Missionary"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-parchment-300 text-ink-600 rounded text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="archive-card overflow-hidden">
            {isLoading ? (
              <p className="p-8 text-center text-ink-400">Loading…</p>
            ) : missionaries.length === 0 ? (
              <p className="p-8 text-center text-ink-400 text-sm">No missionaries yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-parchment-100 border-b border-parchment-200">
                  <tr>
                    {["Name", "Nationality", "Mission Society", "Region", "Years", "Added"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-100">
                  {missionaries.map((m) => (
                    <tr key={m.id} className="hover:bg-parchment-50">
                      <td className="px-4 py-3 font-medium text-ink-700 font-serif">{m.name}</td>
                      <td className="px-4 py-3 text-ink-600">{m.nationality || "—"}</td>
                      <td className="px-4 py-3 text-ink-600">{m.mission_society || "—"}</td>
                      <td className="px-4 py-3 text-ink-600">{m.region || "—"}</td>
                      <td className="px-4 py-3 text-ink-500 text-xs">
                        {m.birth_year && m.death_year ? `${m.birth_year}–${m.death_year}` : m.birth_year || "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-400 text-xs">{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
