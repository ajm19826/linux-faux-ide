// coop-sw.js - Advanced ProzySense Interceptor
const PROXY_PREFIX = '/service/';
const BARE_SERVER = 'https://your-bare-server.com'; // Replace with your actual relay

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept only requests starting with our proxy prefix
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    event.respondWith(handleProxyRequest(event.request));
  } else {
    // Normal site requests still get COOP/COEP for VM support
    event.respondWith(
      fetch(event.request).then(res => injectSecurityHeaders(res))
    );
  }
});

async function handleProxyRequest(request) {
  const url = new URL(request.url);
  // Extract the target URL (e.g., /service/https://google.com -> https://google.com)
  const actualTarget = decodeURIComponent(url.pathname.slice(PROXY_PREFIX.length) + url.search);

  try {
    // Advanced: Route via a 'Bare Server' to bypass CORS and hide your IP
    const proxyUrl = `${BARE_SERVER}?url=${encodeURIComponent(actualTarget)}`;
    
    const response = await fetch(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' ? await request.blob() : null
    });

    return injectSecurityHeaders(response);
  } catch (err) {
    return new Response("ProzySense Error: Could not reach target.", { status: 500 });
  }
}

function injectSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
