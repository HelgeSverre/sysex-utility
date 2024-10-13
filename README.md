# 🎹↯ MIDI SysEx Utility

The MIDI SysEx Utility is a web-based tool for sending and receiving System Exclusive (SysEx) messages to and from your
MIDI devices.

## ✨ Features

- 🔌 Connect to MIDI input and output devices for sending and receiving MIDI messages
- 📤 Send custom SysEx strings or files to your MIDI devices
- 📥 Real-time MIDI message monitoring
- 🌈 Color-coded message types for easy identification
- 🤖 Dummy data generation for testing and demonstration
- 🔍 Detailed message parsing and formatting
- 💾 Store received SysEx messages to save your synth patches, banks, sequences and more
- 🌓 Dark mode interface

## 🖥️ Demo

[View Live Demo](https://sysex-util.vercel.app/)

![MIDI SysEx Utility Screenshot](./art/screenshot.png)

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
   - Press Enter to send, or Shift + Enter for a new line
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

## 🚩 Reporting Bugs and Requesting Features

We value your feedback and contributions to improve the MIDI SysEx Utility. If you encounter any bugs or have ideas for
new features:

1. Check the [existing issues](https://github.com/yourusername/midi-sysex-utility/issues) to see if it has already been
   reported or suggested.
2. If not, [open a new issue](https://github.com/yourusername/midi-sysex-utility/issues/new), providing as much detail
   as possible.
3. For bug reports, include steps to reproduce, expected behavior, and actual behavior.
4. For feature requests, explain the rationale and potential implementation ideas if you have any.

Your input helps make this tool better for everyone in the MIDI community!

## 📝 Resources and Credits

- [MIDI Specification documentation](http://midi.teragonaudio.com/tech/midispec.htm) - A comprehensive resource for
  understanding the MIDI protocol and SysEx messages.
- List of MIDI Manufacturer IDs forked
  from [francoisgeorgy/midi-manufacturers](https://github.com/francoisgeorgy/midi-manufacturers) - Used to identify and
  display manufacturer names for SysEx messages.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
