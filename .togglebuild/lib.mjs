// .togglebuild/stub.js
var h = { get: (_t, p) => String(p) };
var Color = new Proxy({}, h);
var Icon = new Proxy({}, h);
function getPreferenceValues() {
  throw new Error("no prefs");
}

// src/lib/config.ts
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var exec = promisify(execFile);
var BINARY_CANDIDATES = [
  "/opt/homebrew/bin/aerospace",
  "/usr/local/bin/aerospace",
  "/Applications/AeroSpace.app/Contents/Resources/aerospace"
];
var CONFIG_CANDIDATES = [
  join(homedir(), ".aerospace.toml"),
  join(homedir(), ".config", "aerospace", "aerospace.toml")
];
function expandHome(path) {
  return path.startsWith("~") ? join(homedir(), path.slice(1)) : path;
}
function preference(name) {
  try {
    const value = getPreferenceValues()[name]?.trim();
    return value ? expandHome(value) : void 0;
  } catch {
    return void 0;
  }
}
var cachedBinary = null;
async function aerospaceBinary() {
  if (cachedBinary) return cachedBinary;
  const configured = preference("aerospacePath");
  const candidates = configured ? [configured, ...BINARY_CANDIDATES] : BINARY_CANDIDATES;
  for (const candidate of candidates) {
    try {
      await exec(candidate, ["--version"]);
      cachedBinary = candidate;
      return candidate;
    } catch {
    }
  }
  throw new Error(
    configured ? `No aerospace binary at ${configured}, and none at the usual locations. Check the AeroSpace Binary path in this extension's preferences.` : "Could not find the aerospace binary. Install AeroSpace, or set its path in this extension's preferences (\u2318, with this command selected)."
  );
}
async function aerospace(...args) {
  const bin = await aerospaceBinary();
  const { stdout } = await exec(bin, args);
  return stdout.trim();
}

// src/lib/workspaces.ts
async function toggleAerospace() {
  try {
    await aerospace("enable", "on", "--fail-if-noop");
    return "enabled";
  } catch {
    await aerospace("enable", "off");
    return "disabled";
  }
}
export {
  toggleAerospace
};
/*! Bundled license information:

smol-toml/dist/date.js:
smol-toml/dist/error.js:
smol-toml/dist/util.js:
smol-toml/dist/primitive.js:
smol-toml/dist/extract.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
