// Cloudflare Worker: openai-proxy-worker.js
// This Worker proxies requests to OpenAI and keeps your API key secret.

export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Read the request body (should contain 'messages' for OpenAI)
    const body = await request.text();

    // Forward the request to OpenAI's API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}` // Use Worker secret
      },
      body
    });

    // Return the OpenAI response directly to the frontend
    return new Response(await openaiResponse.text(), {
      status: openaiResponse.status,
      headers: { "Content-Type": "application/json" }
    });
  }
};
