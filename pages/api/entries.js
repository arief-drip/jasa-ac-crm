import cookie from 'cookie';
import { getEntries, addEntry, updateEntry, deleteEntry } from '../../lib/storage';

function isAuthenticated(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.crm_session === 'verified';
}

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET': {
      const entries = await getEntries();
      return res.status(200).json(entries);
    }

    case 'POST': {
      const { namaJasaAc, contactPerson, nomorWa, provinsi, kotaKab, kecamatan } = req.body;
      if (!namaJasaAc || !nomorWa) {
        return res.status(400).json({ error: 'Nama jasa AC dan nomor WA wajib diisi' });
      }
      const entry = await addEntry({
        namaJasaAc,
        contactPerson: contactPerson || '',
        nomorWa,
        provinsi: provinsi || 'Jawa Timur',
        kotaKab: kotaKab || '',
        kecamatan: kecamatan || '',
      });
      return res.status(201).json(entry);
    }

    case 'PUT': {
      const { id, ...updates } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID wajib diisi' });
      }
      const updated = await updateEntry(parseInt(id), updates);
      if (!updated) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      return res.status(200).json(updated);
    }

    case 'DELETE': {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID wajib diisi' });
      }
      await deleteEntry(parseInt(id));
      return res.status(200).json({ success: true });
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
