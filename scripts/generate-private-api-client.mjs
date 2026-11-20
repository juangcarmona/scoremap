import { readFileSync, writeFileSync } from "node:fs";
import * as prettier from "prettier";

const source = process.argv.find((arg) => arg.startsWith("--schema="))?.slice("--schema=".length) ?? "tests/contract/private-api.openapi.json";
const destination = "src/shared/api/private-client.gen.ts";
const schema = JSON.parse(readFileSync(source, "utf8"));
const pascal = (value) => value.split(/[^A-Za-z0-9]+/u).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
const operations = [];
for (const [path, verbs] of Object.entries(schema.paths)) {
  for (const [verb, operation] of Object.entries(verbs)) {
    if (!["get", "post", "put", "delete", "patch"].includes(verb)) throw new Error(`Unsupported API operation: ${verb}`);
    if (operation.parameters?.some((parameter) => parameter.in !== "path" || !parameter.required)) throw new Error(`Unsupported API parameters: ${path}`);
    const segments = path.split("/").filter(Boolean);
    const suffix = segments.map((part) => part.startsWith("{") ? "By" + pascal(part.slice(1, -1)) : pascal(part)).join("");
    const name = verb + suffix;
    const typeName = pascal(name);
    const parameters = (operation.parameters ?? []).filter((parameter) => parameter.in === "path");
    const hasBody = !!operation.requestBody;
    const args = ["request: Transport", ...(parameters.length ? [`path: Api.${typeName}Data[\"path\"]`] : []), ...(hasBody ? [`body: Api.${typeName}Data[\"body\"]`] : [])];
    const url = "`" + path.replace(/\{([^}]+)\}/gu, (_, name) => `\${encodeURIComponent(path[${JSON.stringify(name)}])}`) + "`";
    operations.push(`export const ${name} = (${args.join(", ")}): Promise<Api.${typeName}Responses[keyof Api.${typeName}Responses]> => request(${url}, { method: ${JSON.stringify(verb.toUpperCase())}${hasBody ? ", body: JSON.stringify(body)" : ""} });`);
  }
}
const output = await prettier.format(`// Generated from the registered partial private API contract. Do not edit.\nimport type * as Api from "./private-api.gen";\nexport type Transport = <T>(path: string, init?: RequestInit) => Promise<T>;\n${operations.join("\n")}\n`, { ...(await prettier.resolveConfig(destination)), parser: "typescript" });
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output) throw new Error("Generated private API client drifted; run npm run generate:private-api-client.");
  console.log(`Generated HTTP client matches ${operations.length} contract operations.`);
} else writeFileSync(destination, output);
