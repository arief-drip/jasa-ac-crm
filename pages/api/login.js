import cookie from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  
  if (!password || password !== process.env.CRM_PASSWORD) {
    return res.status(401).json({ error: 'Password salah' });
  }

  // Set session cookie (simple approach: just set a verified flag)
  res.setHeader('Set-Cookie', cookie.serialize('crm_session', 'verified', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }));

  res.status(200).json({ success: true });
}
