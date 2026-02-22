# code-to-xmi-server

Gateway (UI + API) that converts **source code ZIPs or repo URLs** into **UML XMI** by orchestrating two helper services:

- `ir-service` (Node, built in `frontend-to-ir` repo): produces **IR JSON**
- `xmi-service` (Node + JRE, built in `java-to-xmi` repo): produces **XMI**
- `gateway` (this repo): single public endpoint that orchestrates the pipeline

Nothing is vendored. During development you run the repos side-by-side; `docker-compose.dev.yml` builds the helper services from their own repositories.

## Expected workspace layout

Clone the repos side-by-side:

```
workspace/
  frontend-to-ir/      # your repo
  java-to-xmi/         # your repo
  code-to-xmi-server/  # this repo
```


> Note: This repository contains only the `gateway` service. The `ir-service` and `xmi-service` sources live in the `frontend-to-ir` and `java-to-xmi` repositories respectively.
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

Gateway runs in watch mode in `docker-compose.dev.yml`, so changes under `services/gateway/src` and `services/gateway/public` are picked up automatically (no rebuild needed).

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



## Snapshot and release images (GHCR)

For end users who just want to run the service (no source checkout), the easiest approach is to pull prebuilt images from GitHub Container Registry (GHCR).

Images:

- Gateway (built in this repo): `ghcr.io/erland/code-to-xmi-gateway`
- IR service (built in `frontend-to-ir` repo): `ghcr.io/erland/code-to-xmi-ir-service`
- XMI service (built in `java-to-xmi` repo): `ghcr.io/erland/code-to-xmi-xmi-service`

Tag conventions:

- `snapshot` – latest snapshot build for that image
- `sha-<7>` – snapshot tied to a specific commit **in that image’s own repository**
- `vX.Y.Z` / `latest` – official release builds (from git tags)

### Quick start (no source checkout)

If you just want to run the latest **snapshot** or an **official release** without cloning any repositories, the easiest way is to use the published images.

Create a new folder anywhere on your machine and add a `docker-compose.yml` like this (or copy `docker-compose.ghcr.yml` from this repo). Using `pull_policy: always` ensures `:snapshot` refreshes on each `docker compose up`:

```yaml
services:
  gateway:
    image: ghcr.io/erland/code-to-xmi-gateway:snapshot
    ports:
      - "8080:8080"
    environment:
      IR_SERVICE_URL: http://ir-service:7071
      XMI_SERVICE_URL: http://xmi-service:7072
    depends_on:
      - ir-service
      - xmi-service

  ir-service:
    image: ghcr.io/erland/code-to-xmi-ir-service:snapshot

  xmi-service:
    image: ghcr.io/erland/code-to-xmi-xmi-service:snapshot
```

Then run:

```bash
docker compose up
```

Open the UI:

- http://localhost:8080/

### Use a specific release

Replace `snapshot` with a release tag, e.g. `v1.0.0` (and optionally use `latest` once you publish it):

- `ghcr.io/erland/code-to-xmi-gateway:v1.0.0`
- `ghcr.io/erland/code-to-xmi-ir-service:v1.0.0`
- `ghcr.io/erland/code-to-xmi-xmi-service:v1.0.0`

### Use a specific snapshot build

If you want a snapshot tied to a particular commit, use each image’s `sha-<7>` tag.

Because the three images are built from different repositories, their SHA tags are not guaranteed to match.
