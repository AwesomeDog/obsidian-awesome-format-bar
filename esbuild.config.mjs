import { readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import process from "node:process";
import { build, context } from "esbuild";

const production = process.argv[2] === "production";
const nodeBuiltins = builtinModules.flatMap((name) => [name, `node:${name}`]);

/** Drops the unused skin tones and sheet data, which halves the payload. */
const slimEmojiData = {
  name: "slim-emoji-data",
  setup(build) {
    build.onLoad(
      { filter: /@emoji-mart[\\/]data[\\/]sets[\\/].*\.json$/ },
      async (args) => {
        const data = JSON.parse(await readFile(args.path, "utf8"));
        const emojis = {};
        for (const [id, emoji] of Object.entries(data.emojis)) {
          const native = emoji.skins?.[0]?.native;
          // `buildEmoji()` skips an id it cannot resolve anyway.
          if (!native) continue;
          emojis[id] = {
            keywords: emoji.keywords,
            name: emoji.name,
            skins: [{ native }],
          };
        }
        return {
          contents: JSON.stringify({
            categories: data.categories.map((category) => ({
              emojis: category.emojis,
              id: category.id,
            })),
            emojis,
          }),
          loader: "json",
        };
      },
    );
  },
};

const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...nodeBuiltins],
  format: "cjs",
  logLevel: "info",
  minify: production,
  charset: "utf8",
  outfile: "main.js",
  plugins: [slimEmojiData],
  sourcemap: production ? false : "inline",
  target: "es2021",
  treeShaking: true,
};

try {
  if (production) {
    await build(options);
  } else {
    const watchContext = await context(options);
    await watchContext.watch();
  }
} catch {
  process.exitCode = 1;
}
