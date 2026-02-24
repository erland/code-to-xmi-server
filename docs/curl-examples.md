## Convert a ZIP (TypeScript)

```bash
curl -sS -X POST http://localhost:8080/v1/xmi   -F language=ts   -F inputZip=@./my-project.zip   -o model.xmi
```

## Convert a repo URL (React)

```bash
curl -sS -X POST http://localhost:8080/v1/xmi   -F language=react   -F repoUrl=https://github.com/org/repo.git   -o model.xmi
```

## Convert Java ZIP with extra options

> Note: If you omit `-F deps=...`, the gateway will not send any `deps` value and the underlying services' default will apply (currently `true`).

```bash
curl -sS -X POST http://localhost:8080/v1/xmi   -F language=java   -F inputZip=@./java-project.zip   -F associations=smart   -F deps=true   -F nestedTypes=uml+import   -o model.xmi
```
