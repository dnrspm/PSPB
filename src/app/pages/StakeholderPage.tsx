import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { useStakeholders } from "../lib/useStakeholders";
import {
  addStakeholder,
  updateStakeholder,
  deleteStakeholder,
} from "../data/mockStakeholders";
import type { Stakeholder } from "../types/stakeholder";

interface FormState {
  nama: string;
  jabatan: string;
  alamat: string;
  telepon: string;
  posElektronik: string;
}

const EMPTY_FORM: FormState = {
  nama: "",
  jabatan: "",
  alamat: "",
  telepon: "",
  posElektronik: "",
};

const FIELDS: { key: keyof FormState; label: string; placeholder: string; type?: string }[] = [
  { key: "nama", label: "Nama", placeholder: "Nama lengkap pemangku kepentingan" },
  { key: "jabatan", label: "Jabatan", placeholder: "Contoh: Sekretaris Jenderal" },
  { key: "alamat", label: "Alamat", placeholder: "Alamat lengkap" },
  { key: "telepon", label: "Telepon", placeholder: "Contoh: 021-5701234" },
  { key: "posElektronik", label: "Pos Elektronik", placeholder: "nama@instansi.go.id", type: "email" },
];

export default function StakeholderPage() {
  const stakeholders = useStakeholders();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Stakeholder | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<Stakeholder | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stakeholders;
    return stakeholders.filter((s) =>
      [s.nama, s.jabatan, s.alamat, s.telepon, s.posElektronik].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [stakeholders, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (s: Stakeholder) => {
    setEditing(s);
    setForm({
      nama: s.nama,
      jabatan: s.jabatan,
      alamat: s.alamat,
      telepon: s.telepon,
      posElektronik: s.posElektronik,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    for (const f of FIELDS) {
      if (!form[f.key].trim()) newErrors[f.key] = "Field ini wajib diisi";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (editing) {
      updateStakeholder({ ...editing, ...form });
    } else {
      addStakeholder({
        id: `sk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...form,
      });
    }
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteStakeholder(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Pemangku Kepentingan</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Kelola daftar pemangku kepentingan yang menjadi pihak dalam perjanjian kerja sama.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Pemangku Kepentingan
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, jabatan, atau kontak..."
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F1F1F1]">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-[#323232]">Nama</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-[#323232]">Jabatan</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-[#323232]">Alamat</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-[#323232]">Telepon</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-[#323232]">Pos Elektronik</th>
                  <th className="w-24 px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wide text-[#323232]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      Belum ada pemangku kepentingan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.nama}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.jabatan}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.alamat}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{s.telepon}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.posElektronik}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            title="Edit"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s)}
                            title="Hapus"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-4 py-5 shrink-0">
              <h2 className="text-sm font-semibold text-gray-800">
                {editing ? "Edit Pemangku Kepentingan" : "Tambah Pemangku Kepentingan"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4 flex-1 min-h-0">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    {f.label}
                    <span className="ml-0.5 text-red-400">*</span>
                  </label>
                  <input
                    type={f.type || "text"}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                  {errors[f.key] && <p className="mt-0.5 text-sm text-red-500">{errors[f.key]}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-4 shrink-0">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editing ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-800">Hapus Pemangku Kepentingan</h2>
            <p className="mt-2 text-sm text-gray-600">
              Yakin ingin menghapus <span className="font-medium text-gray-800">{deleteTarget.nama}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
