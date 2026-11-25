// Access Virus (A, B, C, TI, TI2, Snow)
//
//   F0 00 20 33 01 dd ff ... F7
//
// 00 20 33 = Access, 01 = Virus, dd = device ID (00-0F, 10 and up = omni),
// ff = function.
//
//   Single dump, A/B/C: ... 10 bb pp <256 bytes> cs F7                    (267 bytes)
//   Single dump, TI:    ... 10 bb pp <256 bytes> cs1 <256 bytes> cs2 F7   (524 bytes)
//   Multi dump:         ... 11 bb pp <256 bytes> cs F7                    (267 bytes)
//
// bb = bank (0 = edit buffer, 1 = bank A, ...), pp = program.
// cs = sum of everything from dd up to the checksum, & 7F. On the TI the second
// checksum carries on from the first and includes it.
//
// A bank is sent as one single dump per program, 128 messages in a row.

import { ascii, hex, startsWith, sum } from "./util.js";

const HEADER = [0xf0, 0x00, 0x20, 0x33, 0x01];

const DATA_START = 9;
const PAGE_SIZE = 256;
const SINGLE_NAME_OFFSET = 240;
const MULTI_NAME_OFFSET = 4;
const NAME_LENGTH = 10;

const REQUESTS = {
  0x30: "single request",
  0x31: "multi request",
  0x32: "single bank request",
  0x33: "multi bank request",
  0x34: "arrangement request",
  0x35: "global request",
  0x36: "total request",
  0x37: "controller dump request",
};

const PARAMETER_PAGES = {
  0x6e: "D",
  0x6f: "E",
  0x70: "A",
  0x71: "B",
  0x72: "C",
};

function deviceField(deviceId) {
  return ["Device", deviceId >= 0x10 ? "Omni" : deviceId + 1];
}

function bankLabel(bank) {
  if (bank >= 32 && bank <= 47) return `Embedded multi ${bank - 32}`;
  if (bank >= 1 && bank <= 26) return String.fromCharCode(64 + bank);
  return hex([bank]);
}

function partLabel(part) {
  if (part === 0x40) return "Single";
  if (part === 0x7f) return "Panel";
  return part + 1;
}

// Where a single lives: the edit buffer (single mode or a multi part) or a bank slot.
function singleLocation(bank, program) {
  if (bank !== 0) {
    return [
      ["Bank", bankLabel(bank)],
      ["Program", program],
    ];
  }
  return program === 0x40
    ? [["Location", "Edit buffer"]]
    : [["Location", `Edit buffer, part ${program + 1}`]];
}

// The first data byte is the version of the OS the sound was saved on, which
// tells the generations apart. A TI, TI2 and Snow cannot be told apart this way.
function singleModel(isTi, version) {
  if (isTi) return "Virus TI";
  if (version === 7) return "Virus C";
  if (version === 6) return "Virus B";
  return "Virus";
}

function parseSingleDump(data) {
  const isTi = data.length === 524;
  if (!isTi && data.length !== 267) return null;

  const checksumAt = DATA_START + PAGE_SIZE;
  let checksumOk = (sum(data.slice(5, checksumAt)) & 0x7f) === data[checksumAt];
  if (isTi) {
    checksumOk &&= (sum(data.slice(5, 522)) & 0x7f) === data[522];
  }

  const version = data[DATA_START];
  const nameAt = DATA_START + SINGLE_NAME_OFFSET;

  return {
    model: singleModel(isTi, version),
    kind: "single dump",
    fields: [
      deviceField(data[5]),
      ...singleLocation(data[7], data[8]),
      ["Sound version", version],
    ],
    checksumOk,
    name: ascii(data.slice(nameAt, nameAt + NAME_LENGTH)),
  };
}

function parseMultiDump(data) {
  if (data.length !== 267) return null;

  const checksumAt = DATA_START + PAGE_SIZE;
  const nameAt = DATA_START + MULTI_NAME_OFFSET;
  const bank = data[7];

  return {
    model: "Virus",
    kind: "multi dump",
    fields: [
      deviceField(data[5]),
      ...(bank === 0
        ? [["Location", "Edit buffer"]]
        : [
            ["Bank", bankLabel(bank)],
            ["Program", data[8]],
          ]),
    ],
    checksumOk: (sum(data.slice(5, checksumAt)) & 0x7f) === data[checksumAt],
    name: ascii(data.slice(nameAt, nameAt + NAME_LENGTH)),
  };
}

function parse(data) {
  if (!startsWith(data, HEADER) || data.length < 8) return null;

  const func = data[6];
  const device = deviceField(data[5]);

  if (func === 0x10) return parseSingleDump(data);
  if (func === 0x11) return parseMultiDump(data);

  if (REQUESTS[func]) {
    const fields = [device];

    if (func === 0x30 && data.length === 10) {
      fields.push(...singleLocation(data[7], data[8]));
    } else if (func === 0x37 && data.length === 10) {
      fields.push(["Part", partLabel(data[8])]);
    } else if (data.length === 10 && data[7] !== 0) {
      fields.push(["Bank", bankLabel(data[7])], ["Program", data[8]]);
    } else if (data.length === 10) {
      fields.push(["Location", "Edit buffer"]);
    } else if (data.length === 9) {
      fields.push(["Bank", bankLabel(data[7])]);
    }

    return { model: "Virus", kind: REQUESTS[func], fields };
  }

  if (PARAMETER_PAGES[func] && data.length === 11) {
    return {
      model: "Virus",
      kind: "parameter change",
      fields: [
        device,
        ["Page", PARAMETER_PAGES[func]],
        ["Part", partLabel(data[7])],
        ["Parameter", data[8]],
        ["Value", data[9]],
      ],
    };
  }

  return {
    model: "Virus",
    kind: "message",
    fields: [device, ["Function", hex([func])]],
  };
}

export default { id: "virus", name: "Access", parse };
