"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users, Plus, Trash2, Pencil, Search, X, Loader2, Phone, Mail, Tag, Upload, FileText, CheckCircle2, AlertCircle,
} from "lucide-react";
import type { Contact } from "@/types";
import { formatDate, cn } from "@/lib/utils";

const defaultForm = { name: "", phone: "", email: "", tags: "" };

interface CsvRow { name: string; phone: string; email: string; tags: string; valid: boolean }

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return [];

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("phone") || firstLine.includes("name") || firstLine.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name = "", phone = "", email = "", tags = ""] = cols;
    return { name, phone, email, tags, valid: !!phone };
  }).filter((r) => r.name || r.phone);
}

export default function ContactsPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [search, setSearch] = useState("");

  // Single contact modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Bulk import modal
  const [showImport, setShowImport] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user!.id).single();
    if (!member) return;
    setOrgId(member.org_id);
    const { data } = await supabase.from("contacts").select("*").eq("org_id", member.org_id).order("created_at", { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  }

  const filtered = contacts.filter((c) =>
    [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd() { setEditing(null); setForm({ ...defaultForm }); setError(""); setShowModal(true); }
  function openEdit(c: Contact) {
    setEditing(c);
    setForm({ name: c.name ?? "", phone: c.phone, email: c.email ?? "", tags: (c.tags ?? []).join(", ") });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.phone) { setError("Phone number is required."); return; }
    setSaving(true);
    setError("");
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (editing) {
      const { error } = await supabase.from("contacts").update({
        name: form.name || null, phone: form.phone, email: form.email || null, tags, updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("contacts").insert({
        org_id: orgId, name: form.name || null, phone: form.phone, email: form.email || null, tags,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvRows(parseCsv(text));
      setImportResult(null);
    };
    reader.readAsText(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  async function handleBulkImport() {
    const valid = csvRows.filter((r) => r.valid);
    if (!valid.length) return;
    setImporting(true);
    let success = 0, failed = 0;

    for (const row of valid) {
      const tags = row.tags ? row.tags.split(";").map((t) => t.trim()).filter(Boolean) : [];
      const { error } = await supabase.from("contacts").insert({
        org_id: orgId,
        name: row.name || null,
        phone: row.phone,
        email: row.email || null,
        tags,
      });
      error ? failed++ : success++;
    }

    setImporting(false);
    setImportResult({ success, failed });
    loadData();
  }

  function openImportModal() {
    setCsvRows([]);
    setImportResult(null);
    setShowImport(true);
  }

  const validRows = csvRows.filter((r) => r.valid);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 text-sm mt-1">{contacts.length} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openImportModal} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">{search ? "No contacts match" : "No contacts yet"}</p>
            {!search && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={openImportModal} className="btn-secondary inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Import CSV</button>
                <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Contact</button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Tags</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-whatsapp-teal/10 rounded-full flex items-center justify-center text-whatsapp-teal text-xs font-bold flex-shrink-0">
                        {(c.name ?? c.phone)[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{c.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{c.phone}</div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {c.email ? <div className="flex items-center gap-1.5 text-sm text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-400" />{c.email}</div> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-400">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">{editing ? "Edit Contact" : "Add Contact"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input className="input" placeholder="+27 82 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input className="input" placeholder="lead, vip, support" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-slate-900">Import Contacts</h2>
                <p className="text-xs text-slate-400 mt-0.5">CSV format: name, phone, email, tags (semicolon-separated)</p>
              </div>
              <button onClick={() => setShowImport(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Drop zone */}
              {csvRows.length === 0 && !importResult && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                    dragOver ? "border-whatsapp-teal bg-whatsapp-teal/5" : "border-slate-200 hover:border-whatsapp-teal/50 hover:bg-slate-50"
                  )}
                >
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">Drop your CSV file here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Columns: <span className="font-mono">name, phone, email, tags</span></p>
                  <p className="text-xs text-slate-400 mt-1">Phone number is required. First row can be a header.</p>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
                </div>
              )}

              {/* Preview */}
              {csvRows.length > 0 && !importResult && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-slate-700">{validRows.length} valid contacts ready to import</span>
                      {csvRows.length !== validRows.length && (
                        <span className="text-xs text-red-500">({csvRows.length - validRows.length} skipped — missing phone)</span>
                      )}
                    </div>
                    <button onClick={() => setCsvRows([])} className="text-xs text-slate-400 hover:text-slate-600 underline">Change file</button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Name</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold">Phone</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold hidden sm:table-cell">Email</th>
                          <th className="text-left px-3 py-2 text-slate-500 font-semibold hidden sm:table-cell">Tags</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {csvRows.map((row, i) => (
                          <tr key={i} className={cn(!row.valid && "bg-red-50/50")}>
                            <td className="px-3 py-2 text-slate-700">{row.name || <span className="text-slate-300">—</span>}</td>
                            <td className="px-3 py-2 font-mono text-slate-700">{row.phone || <span className="text-red-400">missing</span>}</td>
                            <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{row.email || "—"}</td>
                            <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{row.tags || "—"}</td>
                            <td className="px-3 py-2">
                              {row.valid
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Result */}
              {importResult && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">{importResult.success} contacts imported successfully</p>
                      {importResult.failed > 0 && <p className="text-xs text-red-600 mt-0.5">{importResult.failed} failed (duplicate phone numbers)</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowImport(false)} className="btn-secondary flex-1">
                {importResult ? "Close" : "Cancel"}
              </button>
              {csvRows.length > 0 && !importResult && (
                <button onClick={handleBulkImport} disabled={importing || validRows.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import {validRows.length} Contacts</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
