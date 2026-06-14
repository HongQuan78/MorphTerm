const fs = require("node:fs");
const pty = require("node-pty");

const commandTimeoutMs = 10_000;
const startupDelayMs = 500;

async function main() {
  if (process.platform !== "win32") {
    console.log("Skipping Windows terminal smoke test on non-Windows platform.");
    return;
  }

  const shells = [
    {
      name: "PowerShell",
      file: "powershell.exe",
      args: [
        "-NoLogo",
        "-NoProfile",
        "-NoExit",
        "-Command",
        "Set-PSReadLineOption -HistorySaveStyle SaveNothing"
      ]
    },
    {
      name: "cmd",
      file: "cmd.exe",
      args: []
    }
  ];
  const gitBashPath = getGitBashPath();

  if (gitBashPath) {
    shells.push({
      name: "Git Bash",
      file: gitBashPath,
      args: ["--login", "-i"]
    });
  } else {
    console.log("Git Bash not found; skipping Git Bash smoke coverage.");
  }

  for (const shell of shells) {
    await runShellSmoke(shell);
  }

  console.log("Windows terminal smoke test passed.");
  process.exit(0);
}

async function runShellSmoke(shell) {
  console.log(`Testing ${shell.name} through ConPTY DLL...`);

  const terminal = pty.spawn(shell.file, shell.args, {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: {
      ...process.env,
      TERM: process.env.TERM || "xterm-256color",
      COLORTERM: process.env.COLORTERM || "truecolor"
    },
    useConpty: true,
    useConptyDll: true
  });
  let output = "";
  const dataSubscription = terminal.onData((data) => {
    output += data;
  });
  const exitPromise = new Promise((resolve) => {
    terminal.onExit(() => {
      resolve();
    });
  });

  try {
    await delay(startupDelayMs);

    terminal.write(
      "node -e \"console.log('MORPH_UNICODE_'+String.fromCodePoint(0x2713,0x4f60,0x597d))\"\r"
    );
    await waitForOutput(
      () => output,
      /MORPH_UNICODE_.*\u2713\u4f60\u597d/,
      `${shell.name} Unicode`
    );
    await delay(250);

    terminal.write(
      "node -e \"const e=String.fromCharCode(27);process.stdout.write(e+'[31mMORPH_ANSI'+e+'[0m'+String.fromCharCode(10))\"\r"
    );
    await waitForOutput(
      () => output,
      /\x1b\[(?:0;)?31mMORPH_ANSI/,
      `${shell.name} ANSI`
    );
    await delay(250);

    terminal.resize(100, 30);
    await delay(shell.name === "Git Bash" ? 750 : 250);

    if (shell.name === "Git Bash") {
      terminal.write("\x15");
      await delay(50);
    }

    terminal.write(
      "node -e \"console.log('MORPH_SIZE_'+process.stdout.columns+'x'+process.stdout.rows)\"\r"
    );
    await waitForOutput(() => output, /MORPH_SIZE_100x30/, `${shell.name} resize`);
    await delay(250);

    terminal.write("node -e \"setInterval(()=>{},1000)\"\r");
    await delay(startupDelayMs);
    terminal.write("\x03");
    await delay(startupDelayMs);
    terminal.write("node -e \"console.log('MORPH_CTRL_C_OK')\"\r");
    await waitForOutput(
      () => output,
      /MORPH_CTRL_C_OK/,
      `${shell.name} Ctrl+C`
    );
  } finally {
    dataSubscription.dispose();
    terminal.write("\x03");
    terminal.write("exit\r");
    await Promise.race([exitPromise, delay(500)]);
  }
}

function waitForOutput(getOutput, pattern, label) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (pattern.test(getOutput())) {
        clearInterval(timer);
        resolve();
        return;
      }

      if (Date.now() - startedAt > commandTimeoutMs) {
        clearInterval(timer);
        reject(new Error(`${label} timed out. Output:\n${getOutput()}`));
      }
    }, 50);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGitBashPath() {
  const candidates = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe"
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
