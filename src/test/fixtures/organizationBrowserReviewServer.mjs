import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";

// Run from the repository root. This is an isolated synthetic review server, never a deployment entry.
await mkdir(".cache", { recursive: true });
await writeFile(
  ".cache/organization-review.html",
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Organization synthetic UI review</title></head><body><div id="root"></div><script type="module" src="/src/test/fixtures/organizationBrowserReview.tsx"></script></body></html>',
);

let f;
let ids;
const server = await createServer({
  server: { host: "127.0.0.1", port: 5178, strictPort: true },
  plugins: [
    {
      name: "synthetic-organization-review",
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/identity/api/v1/")) return next();
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          if (req.headers.authorization !== "Bearer review.header.signature") {
            res.statusCode = 401;
            res.end(
              JSON.stringify({
                success: false,
                data: null,
                error: {
                  code: "Request.Unauthorized",
                  message: "Review identity only",
                  errors: null,
                  traceId: null,
                },
              }),
            );
            return;
          }
          const path = new URL(req.url, "http://127.0.0.1:5178").pathname;
          const page = (items) => ({ items, nextCursor: null });
          let body = {};
          if (req.method !== "GET") {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            try {
              body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
            } catch {
              res.statusCode = 400;
              res.end("{}");
              return;
            }
          }
          let data;
          if (path.endsWith("/me/organizations")) data = page([f.workspace]);
          else if (path.endsWith("/me/ownership-nominations"))
            data = page([f.nomination]);
          else if (path.includes("/organization-invitations/")) {
            if (path.endsWith("/preview")) data = f.preview;
            else if (path.endsWith("/accept")) data = f.acceptance;
            else data = { outcome: "declined", status: "declined", version: 3 };
          } else if (path.endsWith("/members/me")) data = f.member;
          else if (path.endsWith("/permissions"))
            data = {
              codes: [
                "organization.members.read",
                "organization.roles.manage",
                "organization.roles.assign",
                "organization.audit.read",
              ],
            };
          else if (path.endsWith("/audit-events")) data = page([f.audit]);
          else if (path.endsWith("/members")) data = page([f.otherMember]);
          else if (path.endsWith("/roles") && req.method === "GET")
            data = page([f.role]);
          else if (path.includes("/members/"))
            data =
              req.method === "GET"
                ? f.otherMember
                : path.endsWith("/remove")
                  ? { ...f.removal, membershipId: ids.otherMembership }
                  : f.assignment;
          else if (path.endsWith("/invitations") && req.method === "GET")
            data = page([f.invitation]);
          else if (path.includes("/invitations"))
            data = {
              ...f.invitation,
              ...(path.endsWith("/reissue") ? { id: ids.replacement } : {}),
              ...(path.endsWith("/cancel") ? { status: "cancelled" } : {}),
              ...(body.recipientEmail
                ? { recipientEmail: body.recipientEmail }
                : {}),
            };
          else if (
            path.endsWith("/ownership-nominations") &&
            req.method === "GET"
          )
            data = page([f.nomination]);
          else if (path.includes("/ownership-nominations"))
            data = {
              ...f.nomination,
              status: path.endsWith("/accept")
                ? "accepted"
                : path.endsWith("/decline")
                  ? "declined"
                  : path.endsWith("/cancel")
                    ? "cancelled"
                    : "pending",
            };
          else if (path.includes("/roles")) {
            f.role = { ...f.role, ...body, version: f.role.version + 1 };
            data = f.role;
          } else if (path.endsWith("/organizations") && req.method === "POST")
            data = { ...f.creation, name: body.name };
          else {
            res.statusCode = 404;
            res.end("{}");
            return;
          }
          if (
            req.method === "POST" &&
            [
              "/organizations",
              "/roles",
              "/invitations",
              "/ownership-nominations",
            ].some((suffix) => path.endsWith(suffix))
          )
            res.statusCode = 201;
          res.end(JSON.stringify({ success: true, data, error: null }));
        });
      },
    },
  ],
});
({ organizationFixtures: f, organizationIds: ids } = await server.ssrLoadModule(
  "/src/mocks/workspaces.ts",
));
f = structuredClone(f);
await server.listen();
console.log(
  "Synthetic UI review: http://127.0.0.1:5178/.cache/organization-review.html?screen=workspace",
);
