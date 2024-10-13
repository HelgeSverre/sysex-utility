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

/**
 * Parses a MIDI message and returns an object with the message details.
 * @param {Uint8Array|Array} data - The MIDI message data.
 * @return {object} An object with the parsed MIDI message details.
 */
export function parseMIDIMessage(data) {
  const [status, ...dataBytes] = data;
  const messageType = status >> 4;
  const channel = (status & 0xf) + 1;

  const types = {
    0x8: "Note Off",
    0x9: "Note On",
    0xa: "Aftertouch",
    0xb: "Controller",
    0xc: "Program Change",
    0xd: "Channel Pressure",
    0xe: "Pitch Wheel",
    0xf: "System",
  };

  const systemMessages = {
    0xf0: "System Exclusive",
    0xf1: "MTC Quarter Frame",
    0xf2: "Song Position Pointer",
    0xf3: "Song Select",
    0xf6: "Tune Request",
    0xf8: "MIDI Clock",
    0xf9: "MIDI Tick",
    0xfa: "MIDI Start",
    0xfb: "MIDI Continue",
    0xfc: "MIDI Stop",
    0xfe: "Active Sense",
    0xff: "Reset",
  };

  const controllerTypes = {
    0: "Bank Select",
    1: "Modulation Wheel",
    2: "Breath Controller",
    4: "Foot Pedal",
    5: "Portamento Time",
    6: "Data Entry",
    7: "Volume",
    8: "Balance",
    10: "Pan Position",
    11: "Expression",
    12: "Effect Control 1",
    13: "Effect Control 2",
    // ... add more controller types as needed
  };

  let parsed = {
    type: types[messageType] || "Unknown",
    channel: channel,
    data: dataBytes,
  };

  switch (messageType) {
    case 0x8: // Note Off
    case 0x9: // Note On
      parsed.note = dataBytes[0];
      parsed.velocity = dataBytes[1];
      parsed.noteName = getNoteNameFromMIDI(dataBytes[0]);
      break;
    case 0xa: // Aftertouch
      parsed.note = dataBytes[0];
      parsed.pressure = dataBytes[1];
      parsed.noteName = getNoteNameFromMIDI(dataBytes[0]);
      break;
    case 0xb: // Controller
      parsed.controllerType =
        controllerTypes[dataBytes[0]] || `Controller ${dataBytes[0]}`;
      parsed.value = dataBytes[1];
      break;
    case 0xc: // Program Change
      parsed.program = dataBytes[0];
      break;
    case 0xd: // Channel Pressure
      parsed.pressure = dataBytes[0];
      break;
    case 0xe: // Pitch Wheel
      parsed.value = (dataBytes[1] << 7) + dataBytes[0] - 8192;
      break;
    case 0xf: // System messages
      parsed.type = systemMessages[status] || "Unknown System Message";
      if (status === 0xf0) {
        parsed.manufacturer = dataBytes[0];
        parsed.data = dataBytes.slice(1, -1); // Remove manufacturer ID and end of SysEx byte
      }
      break;
  }

  return parsed;
}

/**
 * Converts a MIDI note number to a note name.
 * @param {number} midiNote - The MIDI note number.
 * @return {string} The note name.
 */
export function getNoteNameFromMIDI(midiNote) {
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
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = notes[midiNote % 12];
  return `${noteName}${octave}`;
}
