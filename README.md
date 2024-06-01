# HeadsetControl Indicator

Gnome extension using headsetcontrol to monitor battery.

[<img src="images/Screenshot_from_2023-10-17_18-25-14.png">](images/Screenshot_from_2023-10-17_18-25-14.png)

[[_TOC_]]

## What is this for

This extension allow monitoring battery and toggling RGB lightning on/off for supported headset.

[Supported devices](https://github.com/Sapd/HeadsetControl#supported-headsets)

## Compatible gnome-shell version

- 45
- 46

## Dependencies

You need [HeadsetControl](https://github.com/Sapd/HeadsetControl#building) installed.

Be sure to reload udev rules after installation.

`sudo udevadm control --reload-rules && sudo udevadm trigger`

## How to install

- Clone this repo

`git clone https://gitlab.com/aethernali.live/headsetcontrol-indicator.git`

- cd to the directory

`cd headsetcontrol-indicator`

- Execute install script

`./install.sh`

- Restart gnome-shell and enable the extension
 
## Credits

[Denis Arnst](https://github.com/Sapd) for HeadsetControl

## License

Released under GPL v3
