import path from "node:path";

const index = Bun.file(path.join(process.cwd(), "./src/index.html"));
const styles = Bun.file(path.join(process.cwd(), "./src/styles.css"));
const applause = Bun.file(path.join(process.cwd(), "./src/applause.mp3"));
const clickSound = Bun.file(path.join(process.cwd(), "./src/click.mp3"));
const correctSound = Bun.file(path.join(process.cwd(), "./src/correct.mp3"));
const wrongSound = Bun.file(path.join(process.cwd(), "./src/wrong.mp3"));
const relaxSound = Bun.file(path.join(process.cwd(), "./src/relax.mp3"));
const stressSound = Bun.file(path.join(process.cwd(), "./src/stress.mp3"));
const menuMusic = Bun.file(path.join(process.cwd(), "./src/menu.mp3"));

const result = await Bun.build({
    entrypoints: ["./src/app.ts"],
    target: "browser",
    format: "esm",
});

const script = await result.outputs[0]!.text();

const server = Bun.serve({
    routes: {
        "/": index,
        "/styles.css": new Response(await styles.text(), {
            headers: {
                "Content-Type": "text/css",
                "Cache-Control": "no-store",
            }
        }),
        "/app.js": new Response(script, {
            headers: {
                "Content-Type": "application/javascript",
            },
        }),
        "/applause.mp3": applause,
        "/click.mp3": clickSound,
        "/correct.mp3": correctSound,
        "/wrong.mp3": wrongSound,
        "/relax.mp3": relaxSound,
        "/stress.mp3": stressSound,
        "/menu.mp3": menuMusic,
    },
});

console.log(`Server running on port: ${server.port}`);