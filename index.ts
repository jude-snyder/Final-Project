import path from "node:path";

const index = Bun.file(path.join(process.cwd(), "./src/index.html"));
const styles = Bun.file(path.join(process.cwd(), "./src/styles.css"));
const endSound = Bun.file(path.join(process.cwd(), "./src/end.mp3"));

const result = await Bun.build({
    entrypoints: ["./src/app.ts"],
    target: "browser",
    format: "esm",
});

const script = await result.outputs[0]!.text();

const server = Bun.serve({
    routes: {
        "/": index,
        "/styles.css": styles,
        "/app.js": new Response(script, {
            headers: {
                "Content-Type": "application/javascript",
            },
        }),
        "/end.mp3": endSound,
    },
});

console.log(`Server running on port: ${server.port}`);