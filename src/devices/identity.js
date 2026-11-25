// Universal identity reply:
//
//   F0 7E dd 06 02 <manufacturer: 1 or 3 bytes> f1 f2 m1 m2 v1 v2 v3 v4 F7
//
// dd = device ID, f = family, m = model, v = version.

import MidiManufacturers, {
  ACCESS_MUSIC_ELECTRONICS,
  ARTURIA,
  WALDORF_ELECTRONICS_GMBH,
} from "../midi-manufacturers.js";
import { ascii, hex } from "./util.js";

// Matched top to bottom on manufacturer, then on family and model when given.
const KNOWN_DEVICES = [
  {
    manufacturer: ARTURIA,
    family: "04 00",
    model: "01 01",
    brand: "Arturia",
    name: "MiniBrute SE",
  },
  {
    manufacturer: WALDORF_ELECTRONICS_GMBH,
    family: "13 00",
    brand: "Waldorf",
    name: "Blofeld",
  },
  { manufacturer: ACCESS_MUSIC_ELECTRONICS, brand: "Access", name: "Virus" },
];

// Some synths send the version as text ("1.24"), others as four numbers.
function formatVersion(bytes) {
  const isText = bytes.every((byte) => byte >= 0x20 && byte < 0x7f);
  return isText ? ascii(bytes) : bytes.join(".");
}

/**
 * Parses a universal identity reply.
 * @param {Uint8Array|Array} bytes - A complete SysEx message.
 * @return {object|null} Manufacturer, family, model, version and the known device it matches, if any.
 */
export function parseIdentityReply(bytes) {
  const data = Array.from(bytes);
  const isReply =
    data[0] === 0xf0 &&
    data[1] === 0x7e &&
    data[3] === 0x06 &&
    data[4] === 0x02;
  if (!isReply) return null;

  const idLength = data[5] === 0x00 ? 3 : 1;
  const start = 5 + idLength;
  if (data.length < start + 9) return null;

  const manufacturerId = hex(data.slice(5, start));
  const family = hex(data.slice(start, start + 2));
  const model = hex(data.slice(start + 2, start + 4));

  const device = KNOWN_DEVICES.find(
    (known) =>
      known.manufacturer === manufacturerId &&
      (known.family === undefined || known.family === family) &&
      (known.model === undefined || known.model === model),
  );

  return {
    manufacturerId,
    manufacturerName:
      MidiManufacturers[manufacturerId] ?? "Unknown Manufacturer",
    family,
    model,
    version: formatVersion(data.slice(start + 4, start + 8)),
    device: device ? { brand: device.brand, name: device.name } : null,
  };
}
