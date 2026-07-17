import { readFile, writeFile } from "node:fs/promises";

async function patch(path, replacements) {
  let content = await readFile(path, "utf8");
  for (const [before, after] of replacements) {
    const matches = content.split(before).length - 1;
    if (matches !== 1) {
      throw new Error(`${path}: expected exactly one match, found ${matches}: ${before.slice(0, 120)}`);
    }
    content = content.replace(before, after);
  }
  await writeFile(path, content, "utf8");
}

await patch("mvp-build/apps/manager/src/lib/provisioning-reconciler.ts", [
  [
    "inspectionEvidence(asObject(context.drift_before) as ProvisionerResult)",
    "inspectionEvidence(asObject(context.drift_before) as unknown as ProvisionerResult)",
  ],
  [
    "    attempt,\n    retry_class,\n    error: { message },",
    "    attempt,\n    retry_class: retryClass,\n    error: { message },",
  ],
]);

await patch("mvp-build/apps/manager/src/tools/provisioning.stub.ts", [
  [
    "resources: resources.data ?? []",
    "resources_json: JSON.stringify(resources.data ?? [])",
  ],
]);

await patch("mvp-build/apps/manager/src/webhooks/gmail.ts", [
  [
    "    } catch {\n      return c.newResponse(null, 204);\n    }\n    await enqueueAmbientEvent(serviceClient(), {",
    "    } catch {\n      return c.newResponse(null, 204);\n    }\n    if (!push.history_id) return c.newResponse(null, 204);\n    await enqueueAmbientEvent(serviceClient(), {",
  ],
]);
