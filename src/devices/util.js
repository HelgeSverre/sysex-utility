export function hex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

export function sum(bytes) {
  return Array.from(bytes).reduce((total, byte) => total + byte, 0);
}

export function startsWith(bytes, prefix) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

/**
 * Reads a fixed-width text field. Bytes outside printable ASCII become spaces,
 * since some synths leave junk in unused name positions.
 */
export function ascii(bytes) {
  return (
    Array.from(bytes)
      .map((byte) =>
        byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : " ",
      )
      .join("")
      .trim() || null
  );
}
