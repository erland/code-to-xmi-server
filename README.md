# code-to-xmi-server

Development-friendly example server that converts **source code ZIPs or repo URLs** into **UML XMI** by orchestrating your existing tools as **separate HTTP services**:

- `ir-service` (Node): uses `frontend-to-ir` CLI to produce **IR JSON**
- `xmi-service` (Node + JRE): uses `java-to-xmi` CLI to produce **XMI**
- `gateway` (Node): single public endpoint that orchestrates the pipeline

Nothing is vendored. During development you run this repo **next to** the tool repos and mount them.

## Expected workspace layout

Clone the repos side-by-side:

```
workspace/
  frontend-to-ir/      # your repo
  java-to-xmi/         # your repo
  code-to-xmi-server/  # this repo
```

Build the tools once (on host):

```bash
cd ../frontend-to-ir
npm install
npm run build

cd ../java-to-xmi
mvn -q -DskipTests package
```

## Run with Docker Compose (recommended)

From `code-to-xmi-server/`:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Ports:
- Gateway: http://localhost:8080
- IR service: http://localhost:7071
- XMI service: http://localhost:7072

## API

### POST /v1/xmi (gateway)

`multipart/form-data` fields:

- `inputZip` (file) **or** `repoUrl` (string)
- `language` = `java | ts | js | react | angular`

Optional pass-through fields (forwarded to java-to-xmi):
- `name` (UML model name)
- `associations` (`none|jpa|resolved|smart`)
- `deps` (`true|false`)
- `nestedTypes` (`uml|uml+import|flatten`)
- `includeAccessors` (`true|false`)
- `includeConstructors` (`true|false`)
- `failOnUnresolved` (`true|false`)
- `noStereotypes` (`true|false`)
- `exclude` (repeatable) excludes (for Java source mode)

Response:
- `200` with `application/xml` body (the XMI)

### POST /v1/ir (ir-service)

Same input as gateway, plus:
- `mode` = `ts|js|react|angular` (if not using `language`)

Returns IR JSON.

### POST /v1/xmi (xmi-service)

Accepts:
- `irJson` (text field) OR `inputZip`+`language=java`

Returns XMI.

## Notes

- `repoUrl` cloning requires public access (or you extend it to support tokens).
- The services create a temp workdir per request and delete it afterward.
- ZIP extraction protects against zip-slip paths.

