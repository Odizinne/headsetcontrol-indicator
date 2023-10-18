const GETTEXT_DOMAIN = 'my-indicator-extension';

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

//const _ = ExtensionUtils.gettext;

const LOW_BATTERY_THRESHOLD = 10; // Set the low battery threshold (in percent)

const UPDATE_INTERVAL_SECONDS = 10; // Set the update interval (in seconds)

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        const container = new St.BoxLayout({ style_class: 'panel-status-menu-box' });

        // Create a bin for the icon
        const iconBin = new St.Bin();
        iconBin.child = new St.Icon({
            icon_name: 'audio-headset',
            style_class: 'system-status-icon',
        });

        // Create a bin for the label
        const labelBin = new St.Bin();
        labelBin.child = new St.Label({ text: '' });
        labelBin.y_align = Clutter.ActorAlign.CENTER;

        // Add the icon bin and label bin next to each other
        container.add_child(iconBin);
        container.add_child(labelBin);

        this.add_child(container);

        this.label = labelBin.child;
        this.rgbEnabled = false; // Initialize RGB capability status

        // Create a menu item to enable RGB lighting
        this.enableRGBItem = new PopupMenu.PopupMenuItem(_('Enable RGB Lighting'));
        this.enableRGBItem.connect('activate', () => {
            this.executeShellCommand('headsetcontrol -l 1');
        });
        this.menu.addMenuItem(this.enableRGBItem);
        this.enableRGBItem.actor.hide(); // Initially hide the menu item

        // Create a menu item to disable RGB lighting
        this.disableRGBItem = new PopupMenu.PopupMenuItem(_('Disable RGB Lighting'));
        this.disableRGBItem.connect('activate', () => {
            this.executeShellCommand('headsetcontrol -l 0');
        });
        this.menu.addMenuItem(this.disableRGBItem);
        this.disableRGBItem.actor.hide(); // Initially hide the menu item
        
        // Add a spacer (visual separator)
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Create a menu item to refresh capabilities
        this.refreshCapabilitiesItem = new PopupMenu.PopupMenuItem(_('Refresh Capabilities'));
        this.refreshCapabilitiesItem.connect('activate', () => {
            this.updateCapabilities();
        });
        this.menu.addMenuItem(this.refreshCapabilitiesItem);
        //this.refreshCapabilitiesItem.actor.hide(); // Initially hide the menu item
	
        this.updateCapabilities(); // Check headset capabilities
        this.updateBatteryStatus();

        // Set up a timer to update the battery status at regular intervals
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, UPDATE_INTERVAL_SECONDS, () => {
            this.updateBatteryStatus();
            return GLib.SOURCE_CONTINUE;
        });
    }

    updateCapabilities() {
        // Run the shell command and parse the output to check capabilities
        const [result, stdout, stderr] = GLib.spawn_command_line_sync('headsetcontrol --capabilities');
        const outputLines = stdout.toString().split('\n');
        for (const line of outputLines) {
            if (line.includes('lights')) {
                this.rgbEnabled = true; // "lights" capability found
                this.enableRGBItem.actor.show(); // Show the menu item
                this.disableRGBItem.actor.show(); // Show the menu item
                return;
            }
        }
        // If "lights" capability not found, disable RGB menu entries
        this.rgbEnabled = false;
        this.enableRGBItem.actor.hide(); // Hide the menu item
        this.disableRGBItem.actor.hide(); // Hide the menu item
    }

    updateBatteryStatus() {
        // Run the shell command and parse the output
        const [result, stdout, stderr] = GLib.spawn_command_line_sync('headsetcontrol -b');

        const outputLines = stdout.toString().split('\n');
        for (const line of outputLines) {
            if (line.startsWith('Battery:')) {
                const batteryPercentage = line.match(/\d+/);
                if (batteryPercentage) {
                    const percentage = parseInt(batteryPercentage[0], 10);
                    this.label.text = `${percentage}%`;

                    if (percentage > LOW_BATTERY_THRESHOLD) {
                        this.lowBatteryNotificationSent = false;
                    }

                    if (!this.lowBatteryNotificationSent && percentage <= LOW_BATTERY_THRESHOLD) {
                        Main.notify('Low Battery', `Battery is at ${percentage}%`);
                        this.lowBatteryNotificationSent = true;
                    }
                    return;
                }
            }
        }

        // If the command doesn't produce the expected output, show an error message
        this.label.text = 'N/A';
    }
});

export default class HeadsetControlIndicatorExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new HeadsetControlIndicatorExtension(meta.uuid);
}

