import {
  bytesToHex,
  bytesToVersion,
  extractHexSlice,
  getNoteNameFromMIDI,
  identifyManufacturer,
  isSysexIdentityReply,
  isSysExMessage,
  parseMIDIMessage,
  SYSEX_IDENTITY_REQUEST,
} from "@/utils.js";
import { ARTURIA, WALDORF_ELECTRONICS_GMBH } from "@/midi-manufacturers.js";

export default () => ({
  // MIDI access granted by the browser
  midiAccess: null,

  // Detected device
  detectedDevice: null,

  // Midi devices
  midiInputs: [],
  midiOutputs: [],
  selectedInput: "",
  selectedOutput: "",

  // Log window
  autoScroll: true,
  showLegend: true,
  showTimestamps: true,
  showFilter: false,
  filterSearch: "",
  filterTypes: [],
  logMessages: [],
  selectedMessages: [],

  // The text string to send as a MIDI message
  sentMessages: [],
  clearedMessage: "",
  message: "",

  safeMode: true,

  // Dummy data related
  isDummyDataRunning: false,
  dummyDataInterval: null,

  isSysExMessage(data) {
    return isSysExMessage(data);
  },

  init() {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess({ sysex: true })
        .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
    } else {
      this.logToWindow("WebMIDI is not supported in this browser.", "error");
    }
    this.loadStateFromLocalStorage();

    this.$watch("selectedInput", () => this.handleInputChange());
    this.$watch("selectedOutput", () => this.handleOutputChange());
    this.$watch("autoScroll", () => this.saveStateToLocalStorage());
    this.$watch("showLegend", () => this.saveStateToLocalStorage());
    this.$watch("showTimestamps", () => this.saveStateToLocalStorage());
    this.$watch("showFilter", () => this.saveStateToLocalStorage());
    this.$watch("filterTypes", () => this.saveStateToLocalStorage());
    this.$watch("safeMode", () => this.saveStateToLocalStorage());
  },

  get filteredLogMessages() {
    return this.logMessages.filter((message) => {
      // Type filtering
      const typeMatch =
        this.filterTypes.length === 0 ||
        this.filterTypes.includes(message.type);

      // Text search
      const searchMatch =
        this.filterSearch.trim() === "" ||
        message.message
          .toLowerCase()
          .includes(this.filterSearch.toLowerCase()) ||
        message.type.toLowerCase().includes(this.filterSearch.toLowerCase());

      return typeMatch && searchMatch;
    });
  },

  initializeDummyData() {
    this.generateDummyData();

    this.logToWindow(`F0 00 20 6B 04 01 75 01 3E 01 F7`, "sysex");
    this.logToWindow(`F0 00 20 6B 04 01 75 01 3E 01 F7`, "sysex");
    this.logToWindow(`F0 00 20 6B 04 01 75 01 3E 01 F7`, "sysex");
    [
      "error",
      "warning",
      "info",
      "debug",
      "success",
      "alert",
      "comment",
      "sysex",
      "midi",
    ].forEach((type) => {
      this.logToWindow(`This is an example ${type} message`, type);
    });

    this.logToWindow(
      `F0 00 20 33 01 00 10 00 7F 07 00 03 2F 01 05 00 7F 06 00 40 7F 00 00 00 00 00 00 0C 1C 40 60 00 00 18 40 16 4B 00 40 40 60 00 7F 32 00 40 00 00 40 14 19 00 00 00 6E 5E 40 00 00 00 01 00 02 00 00 7F 40 00 00 5A 37 22 16 00 00 00 70 02 7F 00 00 00 00 4A 40 40 40 40 32 02 7F 01 16 00 01 40 40 40 40 40 50 01 4C 00 00 00 00 30 7F 40 00 01 00 01 00 00 00 70 50 01 00 02 3C 0B 5A 32 01 12 2B 00 00 00 01 00 00 00 00 00 00 00 00 00 40 00 5E 01 00 00 01 00 00 00 00 39 04 00 00 00 00 7F 00 00 01 42 3E 01 00 01 01 01 24 00 01 00 00 00 00 00 1B 50 34 00 2B 55 40 40 40 40 00 00 40 40 40 40 40 00 40 40 40 5E 1B 14 10 00 1A 2A 36 32 65 13 27 2C 29 22 00 40 00 40 14 00 00 02 00 00 00 55 40 7F 00 40 47 33 40 40 40 2A 00 00 00 00 03 00 40 03 00 40 03 00 40 48 61 72 70 73 69 65 20 48 53 00 04 07 01 00 7F 3E F7 Renoise 3.0b3 MIDI panel: F0 00 20 33 01 00 10 00 7F 07 00 03 2F 01 05 00 7F 06 00 40 7F 00 00 00 00 00 00 0C 1C 40 60 00 00 18 40 16 4B 00 40 40 60 00 7F 32 00 40 00 00 40 14 19 00 00 00 6E 5E 40 00 00 00 01 00 02 00 2B 00 00 00 01 00 00 00 00 00 00 00 00 00 40 00 5E 01 00 00 01 00 00 00 00 39 04 00 00 00 00 7F 2B 00 00 00 01 00 00 00 00 00 00 00 00 00 40 00 5E 01 00 00 01 00 00 00 00 39 04 00 00 00 00 7F 2B 00 00 00 01 00 00 00 00 00 00 00 00 00 40 00 5E 01 00 00 01 00 00 00 00 39 04 00 00 00 00 7F 40 40 40 00 40 40 40 5E 1B 14 10 00 1A 2A 36 32 65 13 27 2C 29 22 00 40 00 40 14 00 00 02 00 00 40 40 40 00 40 40 40 5E 1B 14 10 00 1A 2A 36 32 65 13 27 2C 29 22 00 40 00 40 14 00 00 02 00 00 20 48 53 00 04 07 01 00 7F 3E F7 2A 00 00 00 00 03 00 40 03 00 40 03 00 40 48 61 72 70 73 69 65`,
      "sysex",
    );
    this.logToWindow(
      `F0 7E 06 02 00 20 6B 04 00 01 03 01 00 00 00 F7`,
      "sysex",
    );
  },

  clearLog() {
    this.logMessages = [];
    this.logToWindow(`Cleared log messages`, "comment");
  },
  clearMessage() {
    this.clearedMessage = this.message;
    this.message = "";
    this.logToWindow(`Input cleared`, "comment");
  },

  restoreClearedMessage() {
    this.message = this.clearedMessage;
    this.clearedMessage = "";
    this.logToWindow(`Input restored`, "comment");
  },

  onMIDISuccess(access) {
    this.midiAccess = access;
    this.updateDeviceLists();

    // if (this.midiInputs.length === 1 && this.midiOutputs.length === 1) {
    this.selectedInput = this.midiInputs[0].id;
    this.handleInputChange();

    this.selectedOutput = this.midiOutputs[0].id;
    this.handleOutputChange();
    // }

    access.onstatechange = this.onMIDIStateChange.bind(this);
  },

  onMIDIStateChange(event) {
    this.updateDeviceLists();

    if (event.port.state === "disconnected") {
      const portName = event.port.name || "Unknown device";
      this.logToWindow(
        `MIDI ${event.port.type} device disconnected: ${portName}`,
        "warning",
      );

      if (
        event.port.id === this.selectedInput ||
        event.port.id === this.selectedOutput
      ) {
        this.detectedDevice = null;
        this.logToWindow("Detected device data cleared", "info");
      }

      if (event.port.id === this.selectedInput) {
        this.selectedInput = "";
      }
      if (event.port.id === this.selectedOutput) {
        this.selectedOutput = "";
      }
    } else if (event.port.state === "connected") {
      const portName = event.port.name || "Unknown device";
      this.logToWindow(
        `MIDI ${event.port.type} device connected: ${portName}`,
        "success",
      );
    }
  },

  onMIDIFailure(error) {
    this.logToWindow("Could not access your MIDI devices:", "alert");
    this.logToWindow(error.toString(), "error");
  },

  updateDeviceLists() {
    this.midiInputs = Array.from(this.midiAccess.inputs.values());
    this.midiOutputs = Array.from(this.midiAccess.outputs.values());

    // Check if the selected input and output still exist
    if (
      this.selectedInput &&
      !this.midiInputs.find((input) => input.id === this.selectedInput)
    ) {
      this.selectedInput = "";
      this.logToWindow("Selected input device no longer available", "warning");
    }
    if (
      this.selectedOutput &&
      !this.midiOutputs.find((output) => output.id === this.selectedOutput)
    ) {
      this.selectedOutput = "";
      this.logToWindow("Selected output device no longer available", "warning");
    }
  },

  handleInputChange() {
    const selectedDevice = this.midiInputs.find(
      (device) => device.id === this.selectedInput,
    );
    if (selectedDevice) {
      selectedDevice.onmidimessage = this.onMIDIMessage.bind(this);
      this.logToWindow(`Input changed: ${selectedDevice.name}`, "info");
    }
  },

  handleOutputChange() {
    const selectedDevice = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (selectedDevice) {
      this.logToWindow(`Output changed: ${selectedDevice.name}`, "info");
    }
  },

  onMIDIMessage(event) {
    const formattedMessage = this.formatMIDIMessage(event);

    // Active Sensing message, ignore
    if (event.data[0] === 0xfe) {
      return;
    }

    const messageType = isSysExMessage(event.data[0]) ? "sysex" : "midi";
    this.logToWindow(formattedMessage, messageType, {
      raw: event.data,
    });

    if (isSysexIdentityReply(event.data)) {
      // Only the sysex packet data
      const { id, name } = identifyManufacturer(event.data);

      let familyStart, modelStart, versionStart;
      if (id.length === 2) {
        // 1-byte manufacturer ID
        familyStart = 3;
        modelStart = 5;
        versionStart = 7;
      } else {
        // 3-byte manufacturer ID
        familyStart = 5;
        modelStart = 7;
        versionStart = 9;
      }

      const family = extractHexSlice(event.data, familyStart, familyStart + 2);
      const model = extractHexSlice(event.data, modelStart, modelStart + 2);
      const version = bytesToVersion(event.data, versionStart, 4);

      if (id === ARTURIA) {
        // Identity Reply - Manufacturer: 00 20 6B (Arturia), Family: 04 00, Model: 01 01, Version: 1.0.3.2
        if (family === "04 00" && model === "01 01") {
          this.detectedDevice = {
            manufacturer: name,
            name: "Arturia MiniBrute SE",
            version: version,
          };

          this.logToWindow("Arturia MiniBrute SE detected", "debug");
        }
      }

      if (id === WALDORF_ELECTRONICS_GMBH) {
        // F0 7E 00 06 02 3E 13 00 00 00 31 2E 32 34 F7
        // �~ >   1.24
        // Identity Reply - Manufacturer: Waldorf Electronics GmbH (3E), Family: 06 02, Model: 3E 13, Version: 0.0.0.49
        // v 1.25 - 1.25
        if (family === "06 02" && model === "3E 13") {
          this.detectedDevice = {
            manufacturer: "Waldorf",
            name: "Blofeld",
            // version: version,
          };
        }
      }

      const message = `Identity Reply - Manufacturer: ${name} (${id}), Family: ${family}, Model: ${model}, Version: ${version}`;
      this.logToWindow(message, "success");
    }
  },

  logToWindow(message, type = "info", meta = {}) {
    const newEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      type: type,
      ...meta,
    };

    this.logMessages.push(newEntry);

    if (this.autoScroll) {
      this.$nextTick(() => this.scrollToBottom());
    }
  },

  scrollToBottom() {
    const logWindow = this.$refs.logWindow;
    if (logWindow) {
      logWindow.scrollTop = logWindow.scrollHeight;
    }
  },

  saveMessageAsSyx(rawBytes) {
    const blob = new Blob([new Uint8Array(rawBytes)], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "message.syx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.logToWindow("Message saved as .syx file", "info");
  },

  loadFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".syx,.mid,.midi";
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const contents = event.target.result;
        this.message = Array.from(new Uint8Array(contents))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join(" ");
        this.logToWindow(`Loaded file: ${file.name}`, "info");
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  },

  playJazzLick() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );

    if (!output) {
      this.logToWindow("No MIDI output selected", "error");
      return;
    }

    const velocity = 127;
    const tempo = 140;
    const quarterNote = 60000 / tempo;

    // The jazz lick notes (D, E, F, G, E, C, D)
    const notes = [62, 64, 65, 67, 64, 60, 62];
    // Rhythm: eighth, eighth, eighth, eighth, quarter, eighth, quarter
    const durations = [0.5, 0.5, 0.5, 0.5, 1, 0.5, 1].map(
      (d) => d * quarterNote,
    );

    let currentTime = 0;

    notes.forEach((note, i) => {
      setTimeout(() => {
        // Note On
        this.sendMidiMessage([0x90, note, velocity]);
        this.logToWindow(
          `Note On: ${note} (${getNoteNameFromMIDI(note)})`,
          "debug",
        );

        // Note Off
        setTimeout(() => {
          this.sendMidiMessage([0x80, note, 0]);
          this.logToWindow(
            `Note Off: ${note} (${getNoteNameFromMIDI(note)})`,
            "debug",
          );
        }, durations[i] - 10); // Subtract 10ms to ensure note off before next note
      }, currentTime);

      currentTime += durations[i];
    });

    const totalDuration = durations.reduce(
      (acc, duration) => acc + duration,
      0,
    );

    setTimeout(() => {
      this.allNotesOff();
    }, totalDuration + 100);
  },

  allNotesOff() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (!output) {
      this.logToWindow("No MIDI output selected", "error");
      return;
    }

    for (let channel = 0; channel < 16; channel++) {
      this.sendMidiMessage([0xb0 | channel, 123, 0]);
      this.sendMidiMessage([0xb0 | channel, 120, 0]);
    }

    this.logToWindow("Sent All Notes Off on all channels", "info");
  },

  sendInput() {
    this.sendMidiMessage(this.message);
    this.message = "";
  },
  sendMidiMessage(message) {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (!output) {
      this.logToWindow("No MIDI output selected", "error");
      return;
    }

    let data = null;
    if (Array.isArray(message)) {
      data = message;
    } else {
      data = message.split(" ").map((byte) => parseInt(byte, 16));
    }

    this.sentMessages.unshift({
      raw: Array.isArray(message) ? bytesToHex(message) : message,
      bytes: data,
      timestamp: new Date().toISOString(),
    });

    // Limit the number of sent messages stored (e.g., keep only the last 100)
    if (this.sentMessages.length > 50) {
      this.sentMessages.pop();
    }

    if (isSysExMessage(data[0])) {
      if (this.safeMode) {
        this.logToWindow(
          "Safe mode enabled, confirming intent to send message",
          "warning",
        );

        const confirmed = confirm(
          "Safe Mode is enabled, are you sure you want to send the SysEx message?",
        );
        if (!confirmed) {
          this.logToWindow("Message sending cancelled", "warning");
          return;
        }
      }
    }

    this.logToWindow("Sending: " + bytesToHex(data), "debug");

    try {
      output.send(data);
    } catch (error) {
      this.logToWindow(`Error sending MIDI message: ${error.message}`, "error");
    }
  },

  sendSysexIdentityRequest() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (output) {
      try {
        this.sendMidiMessage(SYSEX_IDENTITY_REQUEST);
      } catch (error) {
        this.logToWindow(
          `Error sending MIDI message: ${error.message}`,
          "error",
        );
      }
      this.logToWindow("Sent Identity Request", "info");
    } else {
      this.logToWindow("No MIDI output selected", "warning");
    }
  },

  toggleFilter() {
    this.showFilter = !this.showFilter;
  },

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
  },

  toggleDummyData() {
    if (this.isDummyDataRunning) {
      clearTimeout(this.dummyDataInterval);
      this.isDummyDataRunning = false;
    } else {
      this.isDummyDataRunning = true;
      this.generateDummyData();
    }
  },

  generateDummyData() {
    if (!this.isDummyDataRunning) return;

    const messageTypes = ["midi", "sysex"];
    const randomType =
      messageTypes[Math.floor(Math.random() * messageTypes.length)];

    if (randomType === "midi") {
      const status = Math.floor(Math.random() * 8) + 8;
      const channel = Math.floor(Math.random() * 16);
      const data1 = Math.floor(Math.random() * 128);
      const data2 = Math.floor(Math.random() * 128);
      const midiMessage = [(status << 4) | channel, data1, data2];
      this.onMIDIMessage({ data: midiMessage });
    } else {
      const sysexLength = Math.floor(Math.random() * 20) + 5; // Random length between 5 and 24
      const sysexMessage = [0xf0];
      for (let i = 0; i < sysexLength; i++) {
        sysexMessage.push(Math.floor(Math.random() * 128));
      }
      sysexMessage.push(0xf7);
      this.onMIDIMessage({ data: sysexMessage });
    }

    // Schedule next dummy data generation
    const delay = Math.floor(Math.random() * 100); // Random delay between 500ms and 2500ms
    this.dummyDataInterval = setTimeout(() => this.generateDummyData(), delay);
  },

  formatMIDIMessage(event) {
    const parsed = parseMIDIMessage(event.data);
    let formattedMessage = `Type: ${parsed.type}, Channel: ${parsed.channel}`;

    switch (parsed.type) {
      case "Note On":
      case "Note Off":
        formattedMessage += `, Note: ${parsed.noteName} (${parsed.note}), Velocity: ${parsed.velocity}`;
        break;
      case "Aftertouch":
        formattedMessage += `, Note: ${parsed.noteName} (${parsed.note}), Pressure: ${parsed.pressure}`;
        break;
      case "Controller":
        formattedMessage += `, Controller: ${parsed.controllerType}, Value: ${parsed.value}`;
        break;
      case "Program Change":
        formattedMessage += `, Program: ${parsed.program}`;
        break;
      case "Channel Pressure":
        formattedMessage += `, Pressure: ${parsed.pressure}`;
        break;
      case "Pitch Wheel":
        formattedMessage += `, Value: ${parsed.value}`;
        break;
      case "System Exclusive":
        formattedMessage += `, Manufacturer: ${parsed.manufacturer.toString(16).padStart(2, "0")}, Data: ${bytesToHex(parsed.data)}`;
        break;
      default:
        if (parsed.type.startsWith("System")) {
          formattedMessage +=
            parsed.data.length > 0 ? `, Data: ${bytesToHex(parsed.data)}` : "";
        } else {
          formattedMessage += `, Data: ${bytesToHex(event.data)}`;
        }
    }

    return formattedMessage;
  },

  loadStateFromLocalStorage() {
    const savedState = JSON.parse(localStorage.getItem("midiAppState") || "{}");
    this.autoScroll =
      savedState.autoScroll !== undefined ? savedState.autoScroll : true;
    this.showLegend =
      savedState.showLegend !== undefined ? savedState.showLegend : true;
    this.showTimestamps =
      savedState.showTimestamps !== undefined
        ? savedState.showTimestamps
        : true;
    this.showFilter =
      savedState.showFilter !== undefined ? savedState.showFilter : false;
    this.filterTypes = savedState.filterTypes || [];
    this.safeMode =
      savedState.safeMode !== undefined ? savedState.safeMode : true;
  },

  saveStateToLocalStorage() {
    const stateToSave = {
      selectedInput: this.selectedInput,
      selectedOutput: this.selectedOutput,
      autoScroll: this.autoScroll,
      showLegend: this.showLegend,
      showTimestamps: this.showTimestamps,
      showFilter: this.showFilter,
      filterTypes: this.filterTypes,
      safeMode: this.safeMode,
    };
    localStorage.setItem("midiAppState", JSON.stringify(stateToSave));
  },
});
