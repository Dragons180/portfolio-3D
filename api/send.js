export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, message } = req.body ?? await new Promise((resolve) => {
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => resolve(JSON.parse(body)))
  })

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: ['david.redondo@tradeslide.com'],
      reply_to: email,
      subject: `Portfolio — ${name}`,
      html: `<p><b>Nombre:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Mensaje:</b><br>${message.replace(/\n/g, '<br>')}</p>`,
    }),
  })

  res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : { error: 'Send failed' })
}
