import express from "express";
import multer from "multer";

const app = express();
const upload = multer({ limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB

const IR_SERVICE_URL = process.env.IR_SERVICE_URL || "http://localhost:7071";
const XMI_SERVICE_URL = process.env.XMI_SERVICE_URL || "http://localhost:7072";

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/v1/xmi", upload.single("inputZip"), async (req, res) => {
  try {
    const language = (req.body.language || "").toLowerCase();
    if (!language) return res.status(400).json({ error: "Missing field: language" });

    // forward common options
    const pass = new URLSearchParams();
    const passKeys = [
      "name","associations","deps","nestedTypes","includeAccessors","includeConstructors",
      "failOnUnresolved","noStereotypes"
    ];
    for (const k of passKeys) if (req.body[k] != null && req.body[k] !== "") pass.set(k, String(req.body[k]));

    // forward exclude (repeatable)
    const excludes = req.body.exclude;
    if (Array.isArray(excludes)) {
      for (const ex of excludes) pass.append("exclude", ex);
    } else if (typeof excludes === "string" && excludes.length) {
      pass.append("exclude", excludes);
    }

    const repoUrl = req.body.repoUrl;

    if (language === "java") {
      // go straight to xmi-service (source mode)
      const form = new FormData();
      form.set("language", "java");
      if (repoUrl) form.set("repoUrl", repoUrl);
      if (req.file) form.set("inputZip", new Blob([req.file.buffer]), req.file.originalname);
      for (const [k,v] of pass.entries()) form.append(k, v);

      const resp = await fetch(`${XMI_SERVICE_URL}/v1/xmi`, { method: "POST", body: form });
      const body = await resp.arrayBuffer();
      res.status(resp.status);
      for (const [k,v] of resp.headers.entries()) {
        if (k.toLowerCase() === "content-length") continue;
        res.setHeader(k, v);
      }
      res.send(Buffer.from(body));
      return;
    }

    // For frontend languages: first IR then XMI
    const mode = language; // ts/js/react/angular
    if (!["ts","js","react","angular"].includes(mode)) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // 1) IR
    const irForm = new FormData();
    irForm.set("mode", mode);
    if (repoUrl) irForm.set("repoUrl", repoUrl);
    if (req.file) irForm.set("inputZip", new Blob([req.file.buffer]), req.file.originalname);

    const irResp = await fetch(`${IR_SERVICE_URL}/v1/ir`, { method: "POST", body: irForm });
    if (!irResp.ok) {
      const txt = await irResp.text();
      res.status(irResp.status).type("application/json").send(txt);
      return;
    }
    const irJson = await irResp.text();

    // 2) XMI from IR
    const xmiForm = new FormData();
    xmiForm.set("irJson", irJson);
    for (const [k,v] of pass.entries()) xmiForm.append(k, v);

    const xmiResp = await fetch(`${XMI_SERVICE_URL}/v1/xmi`, { method: "POST", body: xmiForm });
    const xmiBuf = await xmiResp.arrayBuffer();

    res.status(xmiResp.status);
    res.setHeader("content-type", xmiResp.headers.get("content-type") || "application/xml");
    res.send(Buffer.from(xmiBuf));
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(8080, () => {
  console.log("gateway listening on :8080");
});
