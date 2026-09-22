// Launch Obsidian in mobile-emulation mode and leave it open for you to use.
//
//   npm run mobile -- <vault-path> [--size phone|tablet|WxH]
//
// Needs Node 22+ (built-in WebSocket) and no extra dependency: it only talks to
// CDP long enough to switch on `EmulateMobile` and to force the viewport, since
// Obsidian's window can't get narrow enough to look like a phone on its own.
// Obsidian stays open until Ctrl-C.
import { execSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const OBSIDIAN = "/Applications/Obsidian.app/Contents/MacOS/Obsidian";
const PORT = 9222;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const argv = process.argv.slice(2);
const vault =
  argv.find((arg) => !arg.startsWith("--")) || process.env.OBSIDIAN_VAULT;
// Obsidian picks phone vs tablet from `(min-width: 600px) and (min-height: 600px)`,
// so the requested size is what decides the layout.
const presets = { phone: "412x915", tablet: "834x1194" };
const requested = (
  argv.find((arg) => arg.startsWith("--size=")) ?? "--size=phone"
).slice(7);
const size = presets[requested] ?? requested;

if (!vault) {
  console.error(
    "Usage: npm run mobile -- <vault-path> [--size phone|tablet|WxH]",
  );
  process.exitCode = 1;
} else {
  const profile = path.join(tmpdir(), "afb-mobile-profile");
  const kill = () => {
    try {
      execSync(`pkill -f "user-data-dir=${profile}"`, { stdio: "ignore" });
    } catch {
      // Nothing running for this profile.
    }
  };

  try {
    // Obsidian only picks up a vault from its profile config, not from argv.
    await mkdir(profile, { recursive: true });
    await writeFile(
      path.join(profile, "obsidian.json"),
      JSON.stringify({
        vaults: {
          [createHash("sha1").update(vault).digest("hex").slice(0, 16)]: {
            path: vault,
            ts: Date.now(),
            open: true,
          },
        },
        cli: true,
        language: "en",
      }),
    );

    kill();
    await sleep(1500); // Let a shutting-down instance release the profile.
    const obsidian = spawn(
      OBSIDIAN,
      [
        `--user-data-dir=${profile}`,
        `--remote-debugging-port=${PORT}`,
        "--no-sandbox",
        `--window-size=${size.replace("x", ",")}`,
      ],
      { stdio: "ignore" },
    );

    const connect = (url) =>
      new Promise((resolve, reject) => {
        const candidate = new WebSocket(url);
        candidate.addEventListener("open", () => resolve(candidate), {
          once: true,
        });
        candidate.addEventListener("error", reject, { once: true });
      });

    // Obsidian is still wiring up the renderer, and a dying instance can leave a
    // stale target behind, so keep asking until a socket actually opens.
    let socket;
    const deadline = Date.now() + 60_000;
    for (;;) {
      try {
        const targets = await (
          await fetch(`http://127.0.0.1:${PORT}/json/list`)
        ).json();
        const target = targets.find(
          (item) => item.type === "page" && item.url.startsWith("app://"),
        );
        if (target) {
          socket = await connect(target.webSocketDebuggerUrl);
          break;
        }
      } catch {
        // Not ready, or the previous instance is still shutting down.
      }
      if (Date.now() > deadline) throw new Error("No Obsidian page on CDP");
      await sleep(500);
    }
    const send = (id, method, params = {}) =>
      socket.send(JSON.stringify({ id, method, params }));

    const [width, height] = size.split("x").map(Number);
    send(1, "Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: true,
    });
    send(2, "Runtime.evaluate", {
      expression: `localStorage.setItem("EmulateMobile", "1")`,
    });
    send(3, "Page.reload");
    await sleep(6000);
    socket.close();

    console.log(
      `Mobile emulation is up at ${size.replace("x", "×")}: ${vault}`,
    );
    console.log("Press Ctrl-C to close Obsidian.");

    await new Promise((resolve) => {
      process.on("SIGINT", () => {
        kill();
        resolve();
      });
      obsidian.on("exit", resolve);
    });
  } catch (error) {
    kill();
    console.error("Unable to start the mobile simulation.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
