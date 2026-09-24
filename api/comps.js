// POST /api/comps — Claude (Anthropic API + live web search and web fetch) finds and verifies comps.
// Env: ANTHROPIC_API_KEY (required), CLAUDE_MODEL (default claude-opus-5), CLAUDE_EFFORT (low|medium|high, default high),
//      CLAUDE_MAX_SEARCHES (default 12), APP_PASSWORD (optional; the page must send it), MOCK=1 (sample data, no API call).

const AnthropicSDK = require("@anthropic-ai/sdk");
const Anthropic = AnthropicSDK.default || AnthropicSDK;

const CONDITION_SCALE = "1 heavy fixer, 2 dated/original, 3 clean cosmetic, 4 updated kitchen and baths, 5 high-end remodel";

function buildPrompt(subject, rules) {
  const v = x => (x === null || x === undefined || x === "" ? "unknown, look it up" : x);
  const today = new Date().toISOString().slice(0, 10);
  return `You are the comp researcher for Twin Home Buyer, a Bay Area fix-and-flip company. Search the web now for real sales (Redfin, Zillow, Realtor.com, Compass, county records). Do the work of four people:

1. FACT CHECK THE SUBJECT. Look up the subject's beds, baths, living sf, lot sf, year built, property type and coordinates in public records and listing sites. Report them in "subject_facts".
2. APPRAISER. Find 10-15 real SOLD comps. Search outward: 0.25 mi, 0.5, 0.75, then ${rules.radius || 1} mi. Sold in the last 90 days first, then 180, then 12 months only if needed (max ${rules.months || 12} months). Match property type, living area (within about 20%), beds/baths, lot, age/style and condition. We need TWO sets: AS-IS comps (condition 1-3, like the subject today) and ARV comps (renovated and staged, condition 4-5). Also list PENDING and ACTIVE listings nearby that the subject would compete with after renovation.
3. VERIFIER. Confirm each comp's sale price, date, sf and beds/baths on at least one source (county records, Redfin, Zillow, Realtor.com, brokerage). Open the listing or record pages to confirm the numbers, and put those page URLs in "source_urls". If sources disagree, say so in "notes". Judge condition from listing photos and remarks.
4. DEVIL'S ADVOCATE AND LOCAL EXPERT. Flag busy streets, freeway/rail noise, commercial next door, views, slope, corner lot, cul-de-sac, school or neighborhood boundaries, unpermitted additions and outlier sales. Put nearby sales that should NOT be used in "reject" with the reason. List the biggest risks to the value in "risks".

SUBJECT PROPERTY
Address: ${subject.address}
Type: ${v(subject.type)} · Beds: ${v(subject.beds)} · Baths: ${v(subject.baths)} · Living sf: ${v(subject.sqft)} · Lot sf: ${v(subject.lot)} · Year built: ${v(subject.year)}
Condition today: not set by the buyer. Judge it from the listing photos and remarks (${CONDITION_SCALE}) and report it as subject_facts.condition.
Notes from the buyer: ${subject.notes || "none"}
Today's date: ${today}

RULES
- Only real, verifiable transactions. Never invent an address, price or date. If you are not sure a sale happened, leave it out. A short honest list beats a long guessed list.
- Give lat/lng for every comp if you can, and the distance in miles from the subject.
- Numbers without $ or commas.

Reply with ONLY one JSON object, no other text:
{
  "subject_facts": {"beds":0,"baths":0,"sqft":0,"lot_sqft":0,"year_built":0,"property_type":"SFR","condition":2,"lat":0.0,"lng":0.0},
  "comps": [
    {"address":"full street address, city, state zip","status":"Sold|Pending|Active|Withdrawn","price":0,"date":"YYYY-MM-DD",
     "beds":0,"baths":0,"sqft":0,"lot_sqft":0,"year_built":0,"property_type":"SFR|Condo|Townhome|2-4 Unit",
     "condition":1,"lat":0.0,"lng":0.0,"distance_mi":0.0,"source_urls":["https://..."],"notes":"..."}
  ],
  "reject": [{"address":"...","reason":"..."}],
  "value_as_is": 0,
  "value_arv": 0,
  "risks": ["..."],
  "summary": "two sentences on the market around this house"
}`;
}

function extractJSON(text) {
  const t = String(text || "").trim();
  try { return JSON.parse(t); } catch (e) {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1]); } catch (e) {} }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1")); } catch (e) {} }
  return null;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function mockResult(subject) {
  return require("./mock.json");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const pw = process.env.APP_PASSWORD;
  if (pw && req.headers["x-app-password"] !== pw) return send(res, 401, { error: "Wrong or missing team password." });

  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: "Request body is not valid JSON." }); }
  const subject = body.subject || {};
  const rules = body.rules || {};
  if (!subject.address || typeof subject.address !== "string" || subject.address.length > 300)
    return send(res, 400, { error: "Type the property address first." });

  const started = Date.now();
  if (process.env.MOCK === "1") {
    await new Promise(r => setTimeout(r, 1500));
    return send(res, 200, { ...mockResult(subject), model: "mock", elapsed_ms: Date.now() - started, mock: true });
  }
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 500, { error: "The server has no ANTHROPIC_API_KEY. Add it in the hosting settings (see README)." });

  const client = new Anthropic({ timeout: 285000, maxRetries: 1 });
  const model = process.env.CLAUDE_MODEL || "claude-opus-5";
  const effort = process.env.CLAUDE_EFFORT || "high";
  const maxSearches = Number(process.env.CLAUDE_MAX_SEARCHES || 12);
  const prompt = buildPrompt(subject, rules);
  const params = {
    model,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: { effort },
    // If a safety classifier declines, the API re-runs the request on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    tools: [
      { type: "web_search_20260209", name: "web_search", max_uses: maxSearches,
        user_location: { type: "approximate", country: "US", region: "California", timezone: "America/Los_Angeles" } },
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: 10 },
    ],
  };

  let msg, messages = [{ role: "user", content: prompt }];
  const texts = [], citations = [], searched = [];
  try {
    // Web search runs a server-side loop; a long run pauses (pause_turn) and is resumed by re-sending.
    for (let turn = 0; turn < 4; turn++) {
      msg = await client.beta.messages.stream({ ...params, messages }).finalMessage();
      for (const b of msg.content) {
        if (b.type === "text") {
          texts.push(b.text);
          for (const c of b.citations || []) if (c.url) citations.push({ url: c.url, title: c.title || "" });
        } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
          for (const r of b.content) if (r.url) searched.push(r.url);
        }
      }
      if (msg.stop_reason !== "pause_turn") break;
      messages = [{ role: "user", content: prompt }, { role: "assistant", content: msg.content }];
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return send(res, 502, { error: "Claude rejected the API key. Check ANTHROPIC_API_KEY." });
    if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: "Claude is rate limited right now. Try again in a minute." });
    if (e instanceof Anthropic.APIConnectionTimeoutError) return send(res, 504, { error: "Claude took too long. Try again, or set CLAUDE_EFFORT=medium." });
    if (e instanceof Anthropic.APIError) return send(res, 502, { error: `Claude error ${e.status || ""}: ${e.message}` });
    return send(res, 502, { error: `Could not reach Claude: ${e.message}` });
  }
  if (msg.stop_reason === "refusal") return send(res, 502, { error: "Claude declined this request." });

  const text = texts.join("\n");
  const json = extractJSON(texts[texts.length - 1]) || extractJSON(text);
  if (!json) return send(res, 502, { error: "Claude's answer wasn't in the expected format. Run it again.", raw: text.slice(0, 2000) });

  send(res, 200, { ...json, citations, searched: [...new Set(searched)].slice(0, 60), model: msg.model || model, elapsed_ms: Date.now() - started, usage: msg.usage || null });
};
module.exports.buildPrompt = buildPrompt;
module.exports.extractJSON = extractJSON;
