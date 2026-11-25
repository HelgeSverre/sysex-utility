// Yamaha messages that use the XG-style layout with a 3-byte address:
//
//   Bulk dump:        F0 43 0n mm cH cL aH aM aL <data...> cs F7
//   Parameter change: F0 43 1n mm aH aM aL <data...> F7
//
// n = device number, mm = model ID, cH/cL = 14-bit byte count of <data>,
// cs = checksum (count + address + data + checksum sums to 0 in the low 7 bits).
//
// Synths like the VL70-m send one voice as a burst of these messages, one per
// address block, so a single preset arrives as many separate SysEx messages.

import { ascii, hex, sum } from "./util.js";

const MODELS = {
  0x4c: "XG",
  0x57: "VL70-m",
};

// Keyed by model ID, then by the high address byte.
const ADDRESS_AREAS = {
  0x57: {
    0x00: "System",
    0x02: "Effect 1",
    0x03: "Insertion effect",
    0x08: "Multi part",
    0x10: "Current voice common",
    0x20: "Current voice element",
  },
};

// Blocks whose first bytes are the voice name: [model, address high byte, length]
const NAME_BLOCKS = [[0x57, 0x10, 8]];

function readName(modelId, address, payload) {
  const block = NAME_BLOCKS.find(
    ([model, high]) =>
      model === modelId &&
      high === address[0] &&
      address[1] === 0 &&
      address[2] === 0,
  );
  if (!block || payload.length < block[2]) return null;

  return ascii(payload.slice(0, block[2]));
}

function parse(data) {
  const length = data.length;
  if (data[1] !== 0x43) return null;

  const type = data[2] >> 4;
  const modelId = data[3];
  const model = MODELS[modelId] ?? `model ${hex([modelId])}`;
  const device = ["Device", (data[2] & 0x0f) + 1];
  const addressField = (address) => {
    const area = ADDRESS_AREAS[modelId]?.[address[0]];
    return ["Address", hex(address) + (area ? ` (${area})` : "")];
  };

  if (type === 0x0) {
    if (length < 11) return null;

    const byteCount = (data[4] << 7) | data[5];
    const address = data.slice(6, 9);
    const payload = data.slice(9, -2);

    // Older Yamaha dumps (DX7 and friends) have no address, so the count will not line up.
    if (payload.length !== byteCount) return null;

    return {
      model,
      kind: "bulk dump",
      fields: [device, addressField(address), ["Size", `${byteCount} bytes`]],
      checksumOk: (sum(data.slice(4, -1)) & 0x7f) === 0,
      name: readName(modelId, address, payload),
    };
  }

  if (type === 0x1) {
    if (length < 9) return null;

    return {
      model,
      kind: "parameter change",
      fields: [
        device,
        addressField(data.slice(4, 7)),
        ["Value", hex(data.slice(7, -1))],
      ],
    };
  }

  return null;
}

export default { id: "yamaha", name: "Yamaha", parse };
