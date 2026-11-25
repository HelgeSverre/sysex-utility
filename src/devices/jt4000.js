// Behringer JT-4000 Micro
//
//   F0 00 20 32 00 01 38 <command> <arguments...> F7
//
// 00 20 32 = Behringer, 00 01 38 = JT-4000. There is no device ID byte.
//
//   Single preset: ... 15 <64 preset bytes> 00 cs F7      (75 bytes)
//   All presets:   ... 10 <32 x 64 preset bytes> cs F7    (2058 bytes)
//
// cs = (-sum of the preset bytes) & 7F. A dump is always one message. The slot
// number is not part of a single preset dump: the synth sends its selected
// preset and stores a received one in the selected slot.

import { ascii, startsWith, sum } from "./util.js";

const HEADER = [0xf0, 0x00, 0x20, 0x32, 0x00, 0x01, 0x38];
const MODEL = "JT-4000";

const PRESET_SIZE = 64;
const PRESET_COUNT = 32;
const NAME_OFFSET = 55;
const NAME_LENGTH = 9;

const RECEIVE_NOTE =
  "The JT-4000 only accepts a dump while it shows SETTINGS > SYSEX RECEIVE, and gives no reply";

function presetName(preset) {
  return ascii(preset.slice(NAME_OFFSET, NAME_OFFSET + NAME_LENGTH));
}

function checksumOk(presetBytes, checksum) {
  return ((sum(presetBytes) + checksum) & 0x7f) === 0;
}

function parse(data) {
  if (!startsWith(data, HEADER)) return null;

  const command = data[7];
  const length = data.length;
  const message = (kind, extra = {}) => ({ model: MODEL, kind, ...extra });

  if (command === 0x15 && length === 75) {
    const preset = data.slice(8, 8 + PRESET_SIZE);

    return message("preset dump", {
      checksumOk: checksumOk(preset, data[73]),
      name: presetName(preset),
      sendNote: `${RECEIVE_NOTE}. It overwrites the preset that is selected on the synth`,
    });
  }

  if (command === 0x10 && length === 2058) {
    const presets = data.slice(8, 8 + PRESET_SIZE * PRESET_COUNT);
    const names = Array.from({ length: PRESET_COUNT }, (_, slot) =>
      presetName(presets.slice(slot * PRESET_SIZE, (slot + 1) * PRESET_SIZE)),
    );

    return message("all presets dump", {
      fields: [
        ["Presets", PRESET_COUNT],
        ["Names", names.map((name) => name ?? "-").join(" / ")],
      ],
      checksumOk: checksumOk(presets, data[2056]),
      sendNote: `${RECEIVE_NOTE}. It overwrites all ${PRESET_COUNT} presets`,
      sendPauseMs: 500,
    });
  }

  if (command === 0x09 && length === 13) {
    return message("firmware version", {
      fields: [["Version", `${data[9]}.${data[10]}.${data[11]}`]],
    });
  }

  if (command === 0x05) {
    return message("model code", {
      fields: [["Code", ascii(data.slice(8, -1)) ?? "-"]],
    });
  }

  if (command === 0x03) return message("update mode reply");

  if (command === 0x00 && length === 10) {
    return data[8] === 0x20
      ? message("all presets request")
      : message("preset request");
  }

  if (command === 0x04 && length === 9) return message("model code request");
  if (command === 0x08 && length === 9) {
    return message("firmware version request");
  }

  if (command === 0x02 && length === 9) {
    return message("update mode command", {
      dangerous: true,
      sendNote: "This reboots the JT-4000 into firmware update mode",
    });
  }

  return message("message", {
    fields: [["Command", command.toString(16).padStart(2, "0").toUpperCase()]],
  });
}

export default { id: "jt4000", name: "Behringer", parse };
