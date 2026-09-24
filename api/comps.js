// POST /api/comps — ChatGPT (OpenAI Responses API + web search) finds and verifies comps.
// Env: OPENAI_API_KEY (required), OPENAI_MODEL (default gpt-5.5), OPENAI_REASONING (low|medium|high|none),
//      APP_PASSWORD (optional; the page must send it), MOCK=1 (return sample data without calling OpenAI).

const OPENAI_URL = "https://api.openai.com/v1/responses";

const CONDITION_SCALE = "1 heavy fixer, 2 dated/original, 3 clean cosmetic, 4 updated kitchen and baths, 5 high-end remodel";

function buildPrompt(subject, rules) {
  const v = x => (x === null || x === undefined || x === "" ? "unknown, look it up" : x);
  const today = new Date().toISOString().slice(0, 10);
  return `You are the comp researcher for Twin Home Buyer, a Bay Area fix-and-flip company. Search the web now for real sales. Do the work of four people:

1. FACT CHECK THE SUBJECT. Look up the subject's beds, baths, living sf, lot sf, year built, property type and coordinates in public records and listing sites. Report them in "subject_facts".
2. APPRAISER. Find 10-15 real SOLD comps. Search outward: 0.25 mi, 0.5, 0.75, then ${rules.radius || 1} mi. Sold in the last 90 days first, then 180, then 12 months only if needed (max ${rules.months || 12} months). Match property type, living area (within about 20%), beds/baths, lot, age/style and condition. We need TWO sets: AS-IS comps (condition 1-3, like the subject today) and ARV comps (renovated and staged, condition 4-5). Also list PENDING and ACTIVE listings nearby that the subject would compete with after renovation.
3. VERIFIER. Confirm each comp's sale price, date, sf and beds/baths on at least one source (county records, Redfin, Zillow, Realtor.com, brokerage). Put the source URL in "source_urls". If sources disagree, say so in "notes". Judge condition from listing photos and remarks.
4. DEVIL'S ADVOCATE AND LOCAL EXPERT. Flag busy streets, freeway/rail noise, commercial next door, views, slope, corner lot, cul-de-sac, school or neighborhood boundaries, unpermitted additions and outlier sales. Put nearby sales that should NOT be used in "reject" with the reason. List the biggest risks to the value in "risks".

SUBJECT PROPERTY
Address: ${subject.address}
Type: ${v(subject.type)} · Beds: ${v(subject.beds)} · Baths: ${v(subject.baths)} · Living sf: ${v(subject.sqft)} · Lot sf: ${v(subject.lot)} · Year built: ${v(subject.year)}
Condition today: ${subject.cond || 2} (${CONDITION_SCALE})
Notes from the buyer: ${subject.notes || "none"}
Today's date: ${today}

RULES
- Only real, verifiable transactions. Never invent an address, price or date. If you are not sure a sale happened, leave it out. A short honest list beats a long guessed list.
- Give lat/lng for every comp if you can, and the distance in miles from the subject.
- Numbers without $ or commas.

Reply with ONLY one JSON object, no other text:
{
  "subject_facts": {"beds":0,"baths":0,"sqft":0,"lot_sqft":0,"year_built":0,"property_type":"SFR","lat":0.0,"lng":0.0},
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
  const key = process.env.OPENAI_API_KEY;
  if (!key) return send(res, 500, { error: "The server has no OPENAI_API_KEY. Add it in the hosting settings (see README)." });

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const effort = process.env.OPENAI_REASONING || "medium";
  const payload = {
    model,
    tools: [{ type: "web_search", search_context_size: "high", user_location: { type: "approximate", country: "US", region: "California" } }],
    input: buildPrompt(subject, rules),
  };
  if (effort !== "none") payload.reasoning = { effort };

  let data;
  try {
    const r = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(285000),
    });
    data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (data.error && data.error.message) || `OpenAI returned ${r.status}.`;
      return send(res, 502, { error: `ChatGPT error: ${msg}` });
    }
  } catch (e) {
    const timeout = e && (e.name === "TimeoutError" || e.name === "AbortError");
    return send(res, 504, { error: timeout ? "ChatGPT took too long. Try again, or set OPENAI_REASONING=low." : `Could not reach OpenAI: ${e.message}` });
  }

  // Collect the answer text and any cited URLs from the Responses output.
  let text = data.output_text || "";
  const citations = [];
  for (const item of data.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text") {
        if (!data.output_text) text += part.text;
        for (const a of part.annotations || []) if (a.type === "url_citation" && a.url) citations.push({ url: a.url, title: a.title || "" });
      }
    }
  }
  const json = extractJSON(text);
  if (!json) return send(res, 502, { error: "ChatGPT's answer wasn't in the expected format. Run it again.", raw: text.slice(0, 2000) });

  send(res, 200, { ...json, citations, model: data.model || model, elapsed_ms: Date.now() - started, usage: data.usage || null });
};

module.exports.buildPrompt = buildPrompt;
module.exports.extractJSON = extractJSON;
