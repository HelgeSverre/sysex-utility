// Device support lives in one module per synth. Each module exports:
//
//   { id, name, parse(bytes) }
//
// parse() receives one complete SysEx message (F0 ... F7) as an array of bytes
// and returns null when the message is not one of its own, or:
//
//   {
//     model:       "VL70-m"            product the message belongs to
//     kind:        "bulk dump"         what the message is
//     fields:      [["Address", ".."]] label/value pairs for the log line
//     name:        "Trumpet"           patch name carried by the message, if any
//     checksumOk:  true | false        left out when the message has no checksum
//     sendNote:    "..."               shown when the user sends this message
//     sendPauseMs: 500                 pause after sending it (default 100)
//     dangerous:   true                always ask before sending, even with safe mode off
//   }
//
// To support another synth: add a module here and list it in `devices`.

import jt4000 from "./jt4000.js";
import virus from "./virus.js";
import yamaha from "./yamaha.js";

export const devices = [virus, jt4000, yamaha];

/**
 * Parses a SysEx message with the first device module that recognises it.
 * @param {Uint8Array|Array} bytes - A complete SysEx message.
 * @return {object|null} The module's result plus `brand`, or null.
 */
export function parseDeviceSysex(bytes) {
  const data = Array.from(bytes);
  if (data[0] !== 0xf0 || data[data.length - 1] !== 0xf7) return null;

  for (const device of devices) {
    const parsed = device.parse(data);
    if (parsed) return { brand: device.name, ...parsed };
  }

  return null;
}

/**
 * One-line summary of a parsed message for the log window.
 * @param {object} parsed - Result of parseDeviceSysex.
 * @return {string}
 */
export function describeDeviceSysex(parsed) {
  const parts = [`${parsed.brand} ${parsed.model} ${parsed.kind}`];

  for (const [label, value] of parsed.fields ?? []) {
    parts.push(`${label}: ${value}`);
  }
  if (parsed.checksumOk !== undefined) {
    parts.push(`Checksum: ${parsed.checksumOk ? "OK" : "BAD"}`);
  }
  if (parsed.name) parts.push(`Name: ${parsed.name}`);

  return parts.join(", ");
}

/**
 * File name stem for a saved message or dump, e.g. "vl70-m-trumpet".
 * @param {string[]} parts - Model, patch name and so on; empty values are skipped.
 * @return {string}
 */
export function slugify(parts) {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
