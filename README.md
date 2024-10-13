# 🎹↯ MIDI SysEx Utility

MIDI SysEx Utility is a web-based application that allows you to send and receive MIDI System Exclusive (SysEx)
messages. It's perfect for musicians, producers, and MIDI enthusiasts working with hardware synthesizers, effects units,
or any MIDI-enabled devices that use SysEx for configuration and control.

## ✨ Features

- 🔌 Connect to MIDI input and output devices for sending and receiving MIDI messages
- 📤 Send custom SysEx strings or files to your MIDI devices
- 📥 Real-time MIDI message monitoring
- 🌈 Color-coded message types for easy identification
- 🤖 Dummy data generation for testing and demonstration
- ⏱️ Toggleable timestamp display
- 🔍 Detailed message parsing and formatting
- 💾 Store received SysEx messages to save your synth patches, banks, sequences and more
- 🌓 Dark mode interface

## 🖥️ Demo

[View Live Demo](https://midi-sysex-utility.example.com) (Replace with your actual demo link)

![MIDI SysEx Utility Screenshot](./screenshot.png) (Add a screenshot of your application here)

## 🚀 Getting Started

### Prerequisites

- A web browser that supports the Web MIDI API (e.g., Chrome, Edge)
- MIDI devices (input and/or output) for real hardware interaction

### Usage

1. Open the MIDI SysEx Utility in your web browser.
2. Grant MIDI access when prompted by the browser.
3. Select your MIDI input and output devices from the dropdowns.
4. To send a SysEx message:
   - Enter the SysEx string in the input field
   - Press enter, to make a new line press shift + enter
5. Use the "Start Dummy Data" button to generate random MIDI activity for testing.
6. To save a SysEx message:
   - Hover over the message in the log and click the "Save" icon
   - This will open a save dialog to download the SysEx message as a file (`.syx` file extension seems to be common)
7. To load a SysEx message:
   - Click the "Load file" button
   - Select the SysEx file you want to load
   - The SysEx message will be loaded into the input field, to send it press enter

## 🛠️ Development

To set up the project for development:

```shell
# Clone the repository
git clone git@github.com:HelgeSverre/sysex-utility.git

cd sysex-utility

# Install dependencies
yarn install

# Start the development server
yarn dev

# Format the code
yarn format

# Build the project
yarn build
```

Then open `http://localhost:8000` in your web browser.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

Please ensure your code adheres to the existing style and passes any tests.

## 🐛 Troubleshooting

If you encounter issues:

1. Ensure your browser supports the Web MIDI API
2. Check that your MIDI devices are properly connected and recognized by your computer
3. Clear your browser cache and reload the page
4. Check the console for any error messages

Common issues and solutions:

```javascript
// If no MIDI devices are detected
if (midiAccess.inputs.size === 0 && midiAccess.outputs.size === 0) {
  console.error(
    "No MIDI devices detected. Please connect a MIDI device and refresh the page.",
  );
}

// If SysEx messages are not being received
if (navigator.requestMIDIAccess) {
  navigator
    .requestMIDIAccess({ sysex: true })
    .then(onMIDISuccess, onMIDIFailure);
} else {
  console.error("Web MIDI API is not supported in this browser.");
}
```

If you're still having trouble, please [open an issue](https://github.com/yourusername/midi-sysex-utility/issues) on our
GitHub repository.

## 📝 Resources and credits

- [MIDI Specification documentation](http://midi.teragonaudio.com/tech/midispec.htm)
- List of MIDI Manufacturer IDs forked
  from [francoisgeorgy/midi-manufacturers](https://github.com/francoisgeorgy/midi-manufacturers)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
