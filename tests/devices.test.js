import assert from "node:assert/strict";
import { test } from "bun:test";

import {
  describeDeviceSysex,
  parseDeviceSysex,
  slugify,
} from "../src/devices/index.js";
import { parseIdentityReply } from "../src/devices/identity.js";

const bytes = (text) => text.split(" ").map((byte) => parseInt(byte, 16));
const sum = (data) => data.reduce((total, byte) => total + byte, 0);
const text = (value) => Array.from(value, (char) => char.charCodeAt(0));

test("ignores messages no device module knows", () => {
  assert.equal(parseDeviceSysex(bytes("F0 7E 7F 06 01 F7")), null);
  assert.equal(
    parseDeviceSysex(bytes("F0 00 20 6B 04 01 75 01 3E 01 F7")),
    null,
  );
  assert.equal(parseDeviceSysex([0x90, 60, 100]), null);
});

test("Yamaha VL70-m bulk dump block", () => {
  const parsed = parseDeviceSysex(
    bytes("F0 43 00 57 00 04 08 00 70 3F 40 40 40 05 F7"),
  );

  assert.equal(
    describeDeviceSysex(parsed),
    "Yamaha VL70-m bulk dump, Device: 1, Address: 08 00 70 (Multi part), Size: 4 bytes, Checksum: OK",
  );
});

test("Yamaha VL70-m voice name block", () => {
  const parsed = parseDeviceSysex(
    bytes(
      "F0 43 00 57 00 0F 10 00 00 54 72 75 6D 70 65 74 20 00 64 02 00 00 01 00 69 F7",
    ),
  );

  assert.equal(parsed.name, "Trumpet");
  assert.equal(parsed.checksumOk, true);
});

test("Yamaha bulk dump with a damaged byte fails its checksum", () => {
  const parsed = parseDeviceSysex(
    bytes("F0 43 00 57 00 04 08 00 70 3E 40 40 40 05 F7"),
  );

  assert.equal(parsed.checksumOk, false);
});

function jt4000Preset(name) {
  const preset = Array.from({ length: 64 }, (_, index) => index % 100);
  preset.splice(55, 9, ...text(name.padEnd(9)));
  return preset;
}

test("JT-4000 preset dump", () => {
  const preset = jt4000Preset("FATSAW");
  const checksum = -sum(preset) & 0x7f;
  const message = [
    ...bytes("F0 00 20 32 00 01 38 15"),
    ...preset,
    0x00,
    checksum,
    0xf7,
  ];
  const parsed = parseDeviceSysex(message);

  assert.equal(message.length, 75);
  assert.equal(
    describeDeviceSysex(parsed),
    "Behringer JT-4000 preset dump, Checksum: OK, Name: FATSAW",
  );
  assert.match(parsed.sendNote, /SYSEX RECEIVE/);
});

test("JT-4000 all presets dump lists every name", () => {
  const presets = Array.from({ length: 32 }, (_, slot) =>
    jt4000Preset(`P${slot}`),
  ).flat();
  const message = [
    ...bytes("F0 00 20 32 00 01 38 10"),
    ...presets,
    -sum(presets) & 0x7f,
    0xf7,
  ];
  const parsed = parseDeviceSysex(message);

  assert.equal(message.length, 2058);
  assert.equal(parsed.kind, "all presets dump");
  assert.equal(parsed.checksumOk, true);
  assert.equal(parsed.fields[1][1].split(" / ").length, 32);
  assert.equal(parsed.sendPauseMs, 500);
});

test("JT-4000 firmware version reply", () => {
  const parsed = parseDeviceSysex(
    bytes("F0 00 20 32 00 01 38 09 00 01 01 05 F7"),
  );

  assert.equal(
    describeDeviceSysex(parsed),
    "Behringer JT-4000 firmware version, Version: 1.1.5",
  );
});

test("JT-4000 update mode command is flagged as dangerous", () => {
  const parsed = parseDeviceSysex(bytes("F0 00 20 32 00 01 38 02 F7"));

  assert.equal(parsed.dangerous, true);
});

function virusSingle({
  device = 0x10,
  bank,
  program,
  version,
  name,
  ti = false,
}) {
  const page = Array.from({ length: 256 }, () => 0x40);
  page[0] = version;
  page.splice(240, 10, ...text(name.padEnd(10)));

  const body = [device, 0x10, bank, program, ...page];
  body.push(sum(body) & 0x7f);
  if (ti) {
    body.push(...Array.from({ length: 256 }, () => 0x01));
    body.push(sum(body) & 0x7f);
  }

  return [...bytes("F0 00 20 33 01"), ...body, 0xf7];
}

test("Virus C single dump from a bank", () => {
  const message = virusSingle({
    bank: 1,
    program: 5,
    version: 7,
    name: "Harpsie HS",
  });
  const parsed = parseDeviceSysex(message);

  assert.equal(message.length, 267);
  assert.equal(
    describeDeviceSysex(parsed),
    "Access Virus C single dump, Device: Omni, Bank: A, Program: 5, Sound version: 7, Checksum: OK, Name: Harpsie HS",
  );
});

test("Virus TI single dump checks both checksums", () => {
  const message = virusSingle({
    device: 0,
    bank: 0,
    program: 0x40,
    version: 12,
    name: "Init",
    ti: true,
  });
  const parsed = parseDeviceSysex(message);

  assert.equal(message.length, 524);
  assert.equal(parsed.model, "Virus TI");
  assert.equal(parsed.checksumOk, true);
  assert.deepEqual(parsed.fields[1], ["Location", "Edit buffer"]);

  message[400] ^= 1;
  assert.equal(parseDeviceSysex(message).checksumOk, false);
});

test("Virus requests and parameter changes", () => {
  assert.equal(
    describeDeviceSysex(parseDeviceSysex(bytes("F0 00 20 33 01 10 32 01 F7"))),
    "Access Virus single bank request, Device: Omni, Bank: A",
  );
  assert.equal(
    describeDeviceSysex(
      parseDeviceSysex(bytes("F0 00 20 33 01 10 70 05 28 5F F7")),
    ),
    "Access Virus parameter change, Device: Omni, Page: A, Part: 6, Parameter: 40, Value: 95",
  );
});

test("Virus single sent from the panel is the edit buffer", () => {
  const parsed = parseDeviceSysex(
    virusSingle({
      device: 0,
      bank: 0,
      program: 0x7f,
      version: 7,
      name: "Softie  CK",
    }),
  );

  assert.deepEqual(parsed.fields[1], ["Location", "Edit buffer"]);
});

test("Virus global dump that closes a total dump (captured from a Virus C)", () => {
  const head = bytes(
    "F0 00 20 33 01 00 12 01 66 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A 0A 01 04 03 02 15 04 00 00 00 00 00 1E 0C 57 01 01 00 34 01 04 00 40 10 00 00 00 00 7F 00 00 00 00 00 00 00 00 01 00 01 00 00 00 00 40 00 01 00 00 21 00 01 00 00 00 00 00 00 01 04 17 6C 00 00 00 00 00 00 01 01 00 00 00 01 00 00 0F 00 40 00",
  );
  const table = Array.from({ length: 128 }, (_, index) => index);
  const message = [...head, ...table, 0x5c, 0xf7];
  const parsed = parseDeviceSysex(message);

  assert.equal(message.length, 267);
  assert.equal(
    describeDeviceSysex(parsed),
    "Access Virus global dump, Device: 1, Checksum: OK",
  );
});

test("identity reply from a Virus (captured)", () => {
  const identity = parseIdentityReply(
    bytes("F0 7E 00 06 02 00 20 33 00 01 00 00 34 2E 30 78 F7"),
  );

  assert.equal(identity.manufacturerId, "00 20 33");
  assert.equal(identity.family, "00 01");
  assert.equal(identity.model, "00 00");
  assert.equal(identity.version, "4.0x");
  assert.deepEqual(identity.device, { brand: "Access", name: "Virus" });
});

test("identity reply with a 1-byte manufacturer ID", () => {
  const identity = parseIdentityReply(
    bytes("F0 7E 00 06 02 3E 13 00 00 00 31 2E 32 34 F7"),
  );

  assert.equal(identity.manufacturerId, "3E");
  assert.equal(identity.version, "1.24");
  assert.deepEqual(identity.device, { brand: "Waldorf", name: "Blofeld" });
});

test("identity reply with a numeric version", () => {
  const identity = parseIdentityReply(
    bytes("F0 7E 00 06 02 00 20 6B 04 00 01 01 01 00 03 02 F7"),
  );

  assert.equal(identity.version, "1.0.3.2");
  assert.deepEqual(identity.device, { brand: "Arturia", name: "MiniBrute SE" });
});

test("identity parser ignores other messages", () => {
  assert.equal(parseIdentityReply(bytes("F0 7E 7F 06 01 F7")), null);
});

test("slugify builds a file name stem", () => {
  assert.equal(slugify(["VL70-m", "Trumpet"]), "vl70-m-trumpet");
  assert.equal(slugify([null, "128-messages"]), "128-messages");
});
