# HeadsetControl Indicator

Gnome extension using headsetcontrol to monitor battery, updated every 60 seconds.

This extension is made for my own usage on PopOs 22.04 and i have no plan to update it to gnome 45 for now. I'll test gnome 43 and 44 and enable usage for these versions if everything is fine when i have time.

Also I'm a complete JavaScript noob. This was mostly made with the use of ChatGPT. JS purrist, don't read this code, your eyes will (probably) suffer.

[[_TOC_]]

## What is this for

This extension allow monitoring battery and toggling RGB lightning on/off for supported headset.

[Supported devices](https://github.com/Sapd/HeadsetControl#supported-headsets)

## Dependencies

You need [HeadsetControl](https://github.com/Sapd/HeadsetControl#building) installed.

## How to install

- Clone this repo

`git clone https://gitlab.com/aethernali.live/headsetcontrol-indicator.git`

- cd to the directory

`cd headsetcontrol-indicator`

- Create gnome-shell extensions folder if not already existing

`mkdir -p ~/.local/share/gnome-shell/extensions`

- Copy this extension to the gnome-shell extensions folder

`cp -r headsetcontrolindicator@aethernali.live.gitlab.com ~/.local/share/gnome-shell/extensions/`

- Restart gnome-shell and enable the extension
 
## To-do

- Settings menu (Auto disable / enable RGB through battery threshold, Option to disable low battery notification, data fetch rate)

## Credits

[Denis Arnst](https://github.com/Sapd) for HeadsetControl

## License

Released under GPL v3