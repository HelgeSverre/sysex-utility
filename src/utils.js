// Utility functions for MIDI data handling

/**
 * Converts a byte array to a hexadecimal string representation.
 * @param {Uint8Array|Array} data - The byte array to convert.
 * @param {string} [separator=' '] - The separator between hex values (default is space).
 * @return {string} The hexadecimal string representation.
 */
export function bytesToHex(data, separator = " ") {
  return Array.from(data)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(separator);
}

/**
 * Extracts a slice of bytes from a byte array and converts it to a hex string.
 * @param {Uint8Array|Array} data - The byte array to extract from.
 * @param {number} start - The start index of the slice.
 * @param {number} end - The end index of the slice (exclusive).
 * @param {string} [separator=' '] - The separator between hex values (default is space).
 * @return {string} The hexadecimal string representation of the extracted slice.
 */
export function extractHexSlice(data, start, end, separator = " ") {
  return bytesToHex(data.slice(start, end), separator);
}

/**
 * Extracts a slice of bytes from a byte array and converts it to a hex string.
 * @param {Uint8Array|Array} data - The byte array to extract from.
 * @param {number} start - The start index of the slice.
 * @param {number} length - The number of bytes to extract.
 * @param {string} [separator=' '] - The separator between hex values (default is space).
 * @return {string} The hexadecimal string representation of the extracted slice.
 */
export function extractHexData(data, start, length, separator = " ") {
  return bytesToHex(data.slice(start, start + length), separator);
}

/**
 * Converts a byte array to a version string.
 * @param {Uint8Array|Array} data - The byte array containing version information.
 * @param {number} start - The start index of the version bytes.
 * @param {number} length - The number of bytes to use for the version.
 * @return {string} The formatted version string.
 */
export function bytesToVersion(data, start, length) {
  return data.slice(start, start + length).join(".");
}

/**
 * Formats MIDI message data for logging.
 * @param {MIDIMessageEvent} event - The MIDI message event.
 * @return {string} Formatted string representation of the MIDI message.
 */
export function formatMIDIMessage(event) {
  const [status, data1, data2] = event.data;
  const messageType = getMIDIMessageType(status >> 4);
  const channel = (status & 0xf) + 1;
  const hexString = bytesToHex(event.data);

  return `Received: Type: ${messageType}, Channel: ${channel}, Data: ${hexString}`;
}

/**
 * Gets the MIDI message type as a string.
 * @param {number} statusByte - The status byte of the MIDI message.
 * @return {string} The MIDI message type.
 */
export function getMIDIMessageType(statusByte) {
  const types = [
    "Note Off",
    "Note On",
    "Polyphonic Aftertouch",
    "Control Change",
    "Program Change",
    "Channel Aftertouch",
    "Pitch Bend",
    "System",
  ];
  return types[statusByte - 8] || "Unknown";
}

/**
 * Checks if a MIDI message is a SysEx message.
 * @param {number} status - The status byte of the MIDI message.
 * @return {boolean} True if the message is a SysEx message, false otherwise.
 */
export function isSysExMessage(status) {
  return status === 0xf0 || status === 0xf7;
}

export function isSysexIdentityReply(data) {
  return (
    data[0] === 0xf0 && data[1] === 0x7e && data[3] === 0x06 && data[4] === 0x02
  );
}

export function midiToNoteName(note) {
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const noteName = notes[note % 12];
  const octave = Math.floor(note / 12) - 1;
  return `${noteName}${octave}`;
}

export const SYSEX_IDENTITY_REQUEST = [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7];

// F0 00 20 6B 04 00 01 03 01 00 00 00 F7
// F0 7E 06 02 00 20 6B 04 00 01 03 01 00 00 00 F7
