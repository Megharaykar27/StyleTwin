// Free virtual try-on with IDM-VTON, an open-source diffusion model
// (https://github.com/yisol/IDM-VTON) hosted on a free Hugging Face Space.
// No key needed. A free Hugging Face token (HF_TOKEN) gives a bigger daily GPU quota.
// IDM-VTON is trained on upper-body clothes, so it is used for tops and layers.
//
// We talk to the Space with Gradio's plain HTTP queue API (upload -> join -> stream),
// which works with every Gradio 4.x Space and needs no extra library.
import crypto from "node:crypto";
import sharp from "sharp";

const SPACE_URL = (process.env.HF_TRYON_URL || "https://yisol-idm-vton.hf.space").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.HF_TIMEOUT_MS || 180_000);
export const SUPPORTED = new Set(["top", "outerwear"]);

const headers = () => (process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {});

// The model works at 768x1024 (3:4). We pad, never crop, so nothing of the person is cut off.
const toJpeg = (buf, fill) =>
  sharp(buf).rotate().resize(768, 1024, { fit: "contain", background: fill }).jpeg({ quality: 92 }).toBuffer();

let fnIndex = null;
async function tryonIndex(signal) {
  if (fnIndex !== null) return fnIndex;
  const r = await fetch(`${SPACE_URL}/config`, { headers: headers(), signal });
  if (!r.ok) throw new Error(`Space config ${r.status}`);
  const cfg = await r.json();
  const i = cfg.dependencies.findIndex((d) => d.api_name === "tryon");
  if (i < 0) throw new Error("Space has no tryon endpoint");
  return (fnIndex = i);
}

async function upload(buf, name, signal) {
  const fd = new FormData();
  fd.append("files", new Blob([buf], { type: "image/jpeg" }), name);
  const r = await fetch(`${SPACE_URL}/upload`, { method: "POST", body: fd, headers: headers(), signal });
  if (!r.ok) throw new Error(`Upload failed (${r.status})`);
  const [path] = await r.json();
  return { path, orig_name: name, meta: { _type: "gradio.FileData" } };
}

// Read the server-sent events stream until the job finishes
async function waitForResult(sessionHash, signal) {
  const res = await fetch(`${SPACE_URL}/queue/data?session_hash=${sessionHash}`, { headers: headers(), signal });
  if (!res.ok) throw new Error(`Queue stream ${res.status}`);
  const decoder = new TextDecoder();
  let buf = "";
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const event = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (!event.startsWith("data:")) continue;
      const msg = JSON.parse(event.slice(5));
      if (msg.msg === "process_completed") {
        if (!msg.success) throw new Error(msg.output?.error || "Try-on failed on the GPU (often the free daily quota)");
        return msg.output.data;
      }
    }
  }
  throw new Error("Stream ended without a result");
}

export async function tryOn(personBuf, garmentBuf, { description = "a top" } = {}) {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const [person, garment] = await Promise.all([
    toJpeg(personBuf, { r: 240, g: 240, b: 240 }),
    toJpeg(garmentBuf, { r: 255, g: 255, b: 255 }),
  ]);
  const fn = await tryonIndex(signal);
  const [p, g] = await Promise.all([upload(person, "person.jpg", signal), upload(garment, "garment.jpg", signal)]);

  const sessionHash = crypto.randomBytes(6).toString("hex");
  const join = await fetch(`${SPACE_URL}/queue/join`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers() },
    body: JSON.stringify({
      data: [
        { background: p, layers: [], composite: null }, // person photo
        g,                                              // garment photo
        description,                                    // garment description for the prompt
        true,                                           // auto-mask the clothing area
        false,                                          // no crop: image is already 3:4
        30,                                             // denoising steps
        Math.floor(Math.random() * 1e6),                // seed
      ],
      fn_index: fn,
      session_hash: sessionHash,
      event_data: null,
    }),
    signal,
  });
  if (!join.ok) throw new Error(`Queue join failed (${join.status})`);

  const data = await waitForResult(sessionHash, signal);
  const url = data?.[0]?.url || (data?.[0]?.path && `${SPACE_URL}/file=${data[0].path}`);
  if (!url) throw new Error("Space returned no image");
  const img = await fetch(url, { headers: headers(), signal });
  if (!img.ok) throw new Error(`Could not download try-on image (${img.status})`);
  return Buffer.from(await img.arrayBuffer());
}
