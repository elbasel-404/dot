#!/usr/bin/env zx
/************************************************************
 * zx wrapper-shell
 *
 * Acts as a thin wrapper that forwards everything to your
 * login shell (from $SHELL or /bin/bash). Behavior:
 *  - no args  -> launches an interactive login shell
 *  - with args -> runs them through the login shell with -l -c
 *
 * Save as `wrapper-shell` and `chmod +x wrapper-shell`
 * Requires zx: `npm i -g zx` (or install it locally and run via `zx wrapper-shell`)
 ************************************************************/

import "zx/globals";

(async () => {
  // choose login shell (fallback to bash)
  const shell = process.env.SHELL || "/bin/bash";
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // interactive login shell (user sees prompt). This will run the shell
    // as a login shell so it sources login startup files.
    await $`${shell} -l`;
    // propagate the exit code
    process.exit($.exitCode ?? 0);
  } else {
    // join args into a single command string to pass to -c
    // we let zx handle quoting when interpolating ${cmd}
    const cmd = args.join(" ");
    await $`${shell} -lc ${cmd}`;
    process.exit($.exitCode ?? 0);
  }
})();
