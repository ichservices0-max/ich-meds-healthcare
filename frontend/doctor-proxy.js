/**
 * ICH Pro - Doctor Portal Proxy
 * Runs on port 3001 and forwards to the main Next.js app on 3000.
 * Automatically redirects bare / and /login to /doctor/login
 */
const http = require('http')
const httpProxy = require('http-proxy')

const proxy = httpProxy.createProxyServer({ target: 'http://localhost:3000' })

const server = http.createServer((req, res) => {
  const url = req.url || '/'

  // Auto-redirect root and /login → /doctor/login
  if (url === '/' || url === '/login' || url === '/register') {
    const dest = url === '/register' ? '/doctor/register' : '/doctor/login'
    res.writeHead(302, { Location: dest })
    res.end()
    return
  }

  // Block patient dashboard from this portal
  if (url.startsWith('/dashboard')) {
    res.writeHead(302, { Location: '/doctor' })
    res.end()
    return
  }

  proxy.web(req, res)
})

proxy.on('error', (err, req, res) => {
  res.writeHead(502, { 'Content-Type': 'text/plain' })
  res.end('ICH Meds patient app (port 3000) must be running first.')
})

server.listen(3001, () => {
  console.log('')
  console.log('  ╔════════════════════════════════════════╗')
  console.log('  ║         ICH Pro — Doctor Portal        ║')
  console.log('  ║   Running at http://localhost:3001     ║')
  console.log('  ╚════════════════════════════════════════╝')
  console.log('')
})
