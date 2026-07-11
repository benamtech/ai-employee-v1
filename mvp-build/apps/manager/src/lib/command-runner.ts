import { spawn } from "node:child_process";

export interface CommandResult {
  command: string;
  output: string;
}

export async function runCommandString(command: string | undefined, cwd: string, label: string): Promise<CommandResult> {
  if (!command) throw new Error(`${label} command missing.`);
  const [bin, ...args] = command.split(" ").filter(Boolean);
  if (!bin) throw new Error(`${label} command empty.`);
  return await new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, shell: false, env: process.env });
    let out = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { out += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      const output = out.trim() || "ok";
      if (code === 0) resolve({ command, output });
      else reject(new Error(output || `${command} exited ${code}`));
    });
  });
}
