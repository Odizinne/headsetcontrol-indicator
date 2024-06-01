#!/bin/bash

cd "$(dirname "$0")"
pwd
mkdir -p "$HOME/.local/share/gnome-shell/extensions/"
cp -r headsetcontrolindicator@aethernali.live.gitlab.com "$HOME/.local/share/gnome-shell/extensions/"
echo "Extension installed successfully. Restart gnome and enable it using extension manager"