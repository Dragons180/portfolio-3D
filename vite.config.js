import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-send',
        configureServer(server) {
          server.middlewares.use('/api/send', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')

            if (req.method !== 'POST') {
              res.statusCode = 405
              return res.end(JSON.stringify({ error: 'Method not allowed' }))
            }

            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const { name, email, message } = JSON.parse(Buffer.concat(chunks).toString())

            if (!name || !email || !message) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Missing fields' }))
            }

            const r = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
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

            res.statusCode = r.ok ? 200 : 500
            res.end(JSON.stringify(r.ok ? { ok: true } : { error: 'Send failed' }))
          })
        },
      },
    ],
  }
})
