export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Configure GEMINI_API_KEY dans Vercel." });

  const { messages, system } = req.body;

  // Injecter le system prompt dans le premier message
  const contents = [
    {
      role: "user",
      parts: [{ text: system + "\n\nUtilisateur : " + messages[0].content }]
    },
    {
      role: "model",
      parts: [{ text: "Compris. Je suis PROSPER, prêt à t'aider." }]
    },
    ...messages.slice(1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }))
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 1000, temperature: 0.8 }
        }),
      }
    );
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse.";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
