export function parseShellArgs(value: string): string[] {
  const args: string[] = [];
  let currentArg = "";
  let quote: '"' | "'" | null = null;
  let escaping = false;

  for (const character of value.trim()) {
    if (escaping) {
      currentArg += character;
      escaping = false;
      continue;
    }

    if (character === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = null;
      } else {
        currentArg += character;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (/\s/.test(character)) {
      pushArg(args, currentArg);
      currentArg = "";
      continue;
    }

    currentArg += character;
  }

  if (escaping) {
    currentArg += "\\";
  }

  pushArg(args, currentArg);

  return args;
}

function pushArg(args: string[], arg: string): void {
  if (arg.length > 0) {
    args.push(arg);
  }
}
