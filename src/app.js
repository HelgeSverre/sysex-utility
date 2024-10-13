import { isSysExMessage } from "@/utils.js";

export default () => ({
  // MIDI access granted by the browser
  midiAccess: null,

  // Midi devices
  midiInputs: [],
  midiOutputs: [],
  selectedInput: "",
  selectedOutput: "",

  // Log window
  showLegend: true,
  showTimestamps: true,
  showFilter: false,
  filterTypes: [],
  logMessages: [],
  selectedMessages: [],

  // The text string to send as a MIDI message
  clearedMessage: "",
  message: "",

  safeMode: true,

  // Dummy data related
  isDummyDataRunning: false,
  dummyDataInterval: null,

  init() {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess({ sysex: true })
        .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
    } else {
      this.logToWindow("WebMIDI is not supported in this browser.", "error");
    }

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
    access.onstatechange = () => this.updateDeviceLists();
  },

  onMIDIFailure(error) {
    this.logToWindow("Could not access your MIDI devices:", "alert");
    this.logToWindow(error.toString(), "error");
  },

  updateDeviceLists() {
    this.midiInputs = Array.from(this.midiAccess.inputs.values());
    this.midiOutputs = Array.from(this.midiAccess.outputs.values());
  },

  handleInputChange() {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
      const selectedDevice = this.midiAccess.inputs.get(this.selectedInput);
      if (selectedDevice) {
        selectedDevice.onmidimessage = this.onMIDIMessage.bind(this);
        this.logToWindow(`Input changed: ${selectedDevice.name}`, "info");
      }
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
    const messageType = this.isSysExMessage(event.data[0]) ? "sysex" : "midi";
    this.logToWindow(formattedMessage, messageType);
  },

  logToWindow(message, type = "info") {
    const newEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      type: type,
    };
    this.logMessages.push(newEntry);

    this.$nextTick(() => {
      this.scrollToBottom();
    });
  },

  scrollToBottom() {
    const logWindow = this.$refs.logWindow;
    if (logWindow) {
      logWindow.scrollTop = logWindow.scrollHeight;
    }
  },

  sendMidiMessage() {
    const output = this.midiOutputs.find(
      (device) => device.id === this.selectedOutput,
    );
    if (!output) {
      this.logToWindow("No MIDI output selected", "error");
      return;
    }

    const midiMessageAsBytes = this.message
      .split(" ")
      .map((byte) => parseInt(byte, 16));

    if (isSysExMessage(midiMessageAsBytes[0])) {
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

    this.logToWindow("Sending: " + this.bytesToHex(sysexMessage), "info");

    try {
      output.send(midiMessageAsBytes);
    } catch (error) {
      this.logToWindow(`Error sending MIDI message: ${error.message}`, "error");
    }
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

  // Utility functions
  bytesToHex(data, separator = " ") {
    return Array.from(data)
      .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
      .join(separator);
  },

  formatMIDIMessage(event) {
    const [status, data1, data2] = event.data;
    const messageType = this.getMIDIMessageType(status >> 4);
    const channel = (status & 0xf) + 1;
    const hexString = this.bytesToHex(event.data);
    return `Type: ${messageType}, Channel: ${channel}, Data: ${hexString}`;
  },

  getMIDIMessageType(statusByte) {
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
  },

  isSysExMessage(status) {
    return status === 0xf0 || status === 0xf7;
  },
});
