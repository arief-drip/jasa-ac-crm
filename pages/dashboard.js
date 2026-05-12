import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProv, setFilterProv] = useState('');
  const [filterKota, setFilterKota] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    namaJasaAc: '', contactPerson: '', nomorWa: '',
    provinsi: 'Jawa Timur', kotaKab: '', kecamatan: '',
  });

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const showMsg = (msg, type) => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const getWaLink = (entry) => {
    const kota = entry.kotaKab || '';
    const cleanWa = (entry.nomorWa || '').replace(/[^0-9]/g, '');
    const text = `Setiap hari, ada puluhan orang di ${kota} yang mencari "service AC ${kota}" di Google. Yang muncul pertama? Yang punya website sendiri.

Pertanyaannya: dari sekian banyak yang cari AC di ${kota}, apakah sudah ada yang menemukan jasa Bapak/Ibu? 🤔

Faktanya — bisnis AC yang punya website sendiri rata-rata bisa mendapatkan 3-5 service order per hari. Bukan janji. Ini data dari mitra kami.

Kami siap membuatkan website profesional untuk bisnis AC Bapak/Ibu — punya domain sendiri:
🌐 Halaman profil + portofolio
📍 Terindex Google — orang ${kota} gampang menemukan
📱 Tombol WA — 1 klik langsung chat ke HP Bapak/Ibu

Tertarik? Kami menyediakan jasa pembuatan websitenya.

Balas "MAU" ya, nanti kami kirim contoh website + paketnya. 🚀`;
    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showMsg('Data berhasil ditambahkan!', 'success');
        setForm({ namaJasaAc: '', contactPerson: '', nomorWa: '', provinsi: 'Jawa Timur', kotaKab: '', kecamatan: '' });
        setShowAddForm(false);
        fetchEntries();
      } else {
        const d = await res.json();
        showMsg(d.error || 'Gagal', 'error');
      }
    } catch (e) {
      showMsg('Error server', 'error');
    }
  };

  const handleUpdate = async (id, field, value) => {
    try {
      await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      fetchEntries();
    } catch (e) {
      showMsg('Gagal update', 'error');
    }
  };

  const handleBulkUpdate = async (id, updates) => {
    try {
      await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      setEditingId(null);
      fetchEntries();
      showMsg('Data diupdate!', 'success');
    } catch (e) {
      showMsg('Gagal update', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus data ini?')) return;
    try {
      await fetch('/api/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchEntries();
      showMsg('Data dihapus!', 'success');
    } catch (e) {
      showMsg('Gagal hapus', 'error');
    }
  };

  // Filter
  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      e.namaJasaAc?.toLowerCase().includes(q) ||
      e.contactPerson?.toLowerCase().includes(q) ||
      e.nomorWa?.includes(q) ||
      e.kotaKab?.toLowerCase().includes(q) ||
      e.kecamatan?.toLowerCase().includes(q);
    const matchProv = !filterProv || e.provinsi === filterProv;
    const matchKota = !filterKota || e.kotaKab === filterKota;
    return matchSearch && matchProv && matchKota;
  });

  // Unique provinces and cities for filters
  const provinces = [...new Set(entries.map(e => e.provinsi).filter(Boolean))];
  const cities = [...new Set(entries.map(e => e.kotaKab).filter(Boolean))];

  // Stats
  const total = entries.length;
  const contacted = entries.filter(e => e.sudahDihubungi).length;
  const orders = entries.filter(e => e.fixOrder).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-400 text-sm">Memuat data...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">❄️</span>
            <span className="font-bold text-sm">CRM JASA AC</span>
            <span className="text-[10px] text-gray-500 ml-1">v1.0</span>
          </div>
          <button onClick={() => router.push('/')} className="text-xs text-gray-400 hover:text-white transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Notif */}
        {success && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">{success}</div>}
        {error && <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3">
            <div className="text-2xl font-black text-amber-400">{total}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Total Leads</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3">
            <div className="text-2xl font-black text-blue-400">{contacted}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Sudah Dihubungi</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3">
            <div className="text-2xl font-black text-emerald-400">{orders}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Fix Order</div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-amber-500 text-gray-950 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-400 transition">
            {showAddForm ? '✕ Tutup' : '+ Tambah Data'}
          </button>
          <input
            type="text"
            placeholder="🔍 Cari nama, WA, kota..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
          <select value={filterProv} onChange={e => setFilterProv(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
            <option value="">Semua Provinsi</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterKota} onChange={e => setFilterKota(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
            <option value="">Semua Kota</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-gray-500">{filtered.length} dari {total} data</span>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
            <h3 className="font-bold text-sm">Tambah Data Baru</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Nama Jasa AC *</label>
                <input required value={form.namaJasaAc} onChange={e => setForm({...form, namaJasaAc: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" placeholder="CV. Sejahtera AC" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Contact Person</label>
                <input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" placeholder="Pak Budi" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">No. WhatsApp *</label>
                <input required value={form.nomorWa} onChange={e => setForm({...form, nomorWa: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" placeholder="0812-3456-7890" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Provinsi</label>
                <input value={form.provinsi} onChange={e => setForm({...form, provinsi: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Kota/Kab</label>
                <input value={form.kotaKab} onChange={e => setForm({...form, kotaKab: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" placeholder="Surabaya" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Kecamatan</label>
                <input value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" placeholder="Tegalsari" />
              </div>
            </div>
            <button type="submit" className="bg-amber-500 text-gray-950 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 transition">💾 Simpan</button>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-wider text-gray-400">
                <th className="text-left px-3 py-3 font-medium">#</th>
                <th className="text-left px-3 py-3 font-medium">Nama Jasa AC</th>
                <th className="text-left px-3 py-3 font-medium">Contact</th>
                <th className="text-left px-3 py-3 font-medium">No. WA</th>
                <th className="text-left px-3 py-3 font-medium">Lokasi</th>
                <th className="text-center px-3 py-3 font-medium">Dihubungi</th>
                <th className="text-center px-3 py-3 font-medium">Fix Order</th>
                <th className="text-center px-3 py-3 font-medium">Deal</th>
                <th className="text-left px-3 py-3 font-medium">Catatan</th>
                <th className="text-center px-3 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-12 text-gray-500 text-xs">Belum ada data. Tambah data pertama!</td></tr>
              ) : filtered.map((entry, idx) => (
                <tr key={entry.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                  {editingId === entry.id ? (
                    // EDIT MODE
                    <>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <EditField value={entry.namaJasaAc} onChange={v => handleUpdate(entry.id, 'namaJasaAc', v)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditField value={entry.contactPerson || ''} onChange={v => handleUpdate(entry.id, 'contactPerson', v)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditField value={entry.nomorWa} onChange={v => handleUpdate(entry.id, 'nomorWa', v)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs space-y-0.5">
                          <EditField value={entry.kotaKab || ''} onChange={v => handleUpdate(entry.id, 'kotaKab', v)} />
                          <EditField value={entry.kecamatan || ''} onChange={v => handleUpdate(entry.id, 'kecamatan', v)} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Checkbox checked={entry.sudahDihubungi} onChange={v => handleUpdate(entry.id, 'sudahDihubungi', v)} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Checkbox checked={entry.fixOrder} onChange={v => handleUpdate(entry.id, 'fixOrder', v)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" value={entry.dealHarga || ''} onChange={e => handleUpdate(entry.id, 'dealHarga', e.target.value ? parseInt(e.target.value) : null)} className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" placeholder="Rp" />
                      </td>
                      <td className="px-3 py-2.5">
                        <textarea value={entry.catatanCrm || ''} onChange={e => handleUpdate(entry.id, 'catatanCrm', e.target.value)} className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white resize-none h-12" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => setEditingId(null)} className="text-[10px] text-amber-400 hover:text-amber-300">Selesai</button>
                      </td>
                    </>
                  ) : (
                    // VIEW MODE
                    <>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-xs">{entry.namaJasaAc}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-300">{entry.contactPerson || '—'}</td>
                      <td className="px-3 py-2.5">
                        <a href={getWaLink(entry)} target="_blank" className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                          {entry.nomorWa}
                        </a>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-300">
                        {entry.kotaKab}{entry.kecamatan ? `, ${entry.kecamatan}` : ''}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge active={entry.sudahDihubungi} onToggle={() => handleUpdate(entry.id, 'sudahDihubungi', !entry.sudahDihubungi)} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge active={entry.fixOrder} color="emerald" onToggle={() => handleUpdate(entry.id, 'fixOrder', !entry.fixOrder)} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {entry.dealHarga ? (
                          <span className="text-xs font-bold text-emerald-400">Rp {entry.dealHarga.toLocaleString()}</span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 max-w-[150px]">
                        <p className="text-[10px] text-gray-400 truncate">{entry.catatanCrm || '—'}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditingId(entry.id)} className="text-[10px] text-blue-400 hover:text-blue-300 px-1.5 py-1 rounded hover:bg-white/5" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(entry.id)} className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-white/5" title="Hapus">🗑️</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Spek Web Reference */}
        <div className="mt-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-gray-300 mb-2">📋 Spek Web Deal (Default)</h3>
          <div className="grid md:grid-cols-2 gap-2 text-[10px] text-gray-400">
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Landing page 1 halaman (HTML+Tailwind)</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Integrasi Tombol WA (click to chat)</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Domain .my.id / .sch.id (1 tahun)</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Hosting Vercel (gratis / hobby)</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Google Maps embed lokasi usaha</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Optimasi SEO dasar</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Desain mobile-first (responsive)</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">•</span> Gratis revisi 2x</div>
          </div>
        </div>

        {/* Export */}
        <div className="mt-4 flex justify-end">
          <button onClick={() => {
            const csv = [['Nama Jasa AC','Contact Person','No WA','Provinsi','Kota/Kab','Kecamatan','Sudah Dihubungi','Fix Order','Deal Harga','Catatan'].join(',')];
            filtered.forEach(e => {
              csv.push([e.namaJasaAc, e.contactPerson, e.nomorWa, e.provinsi, e.kotaKab, e.kecamatan, e.sudahDihubungi ? 'Ya' : 'Tidak', e.fixOrder ? 'Ya' : 'Tidak', e.dealHarga || '', `"${(e.catatanCrm || '').replace(/"/g, '""')}"`].join(','));
            });
            const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `crm-jasa-ac-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
          }} className="text-xs text-gray-400 hover:text-white transition bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
  );
}

function StatusBadge({ active, onToggle, color = 'blue' }) {
  const colors = { blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30', emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  return (
    <button onClick={onToggle} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${active ? colors[color] : 'bg-gray-800/50 text-gray-500 border-gray-700/30'} transition`}>
      {active ? '✓ Ya' : '✕ Belum'}
    </button>
  );
}

function EditField({ value, onChange }) {
  const [val, setVal] = useState(value);
  const [typing, setTyping] = useState(false);
  
  useEffect(() => { setVal(value); }, [value]);
  
  useEffect(() => {
    if (!typing && val !== value) {
      const timer = setTimeout(() => onChange(val), 500);
      return () => clearTimeout(timer);
    }
  }, [val, typing, value, onChange]);

  return (
    <input value={val} onChange={e => { setVal(e.target.value); setTyping(true); }} onBlur={() => { setTyping(false); if (val !== value) onChange(val); }}
      className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs text-white" />
  );
}
