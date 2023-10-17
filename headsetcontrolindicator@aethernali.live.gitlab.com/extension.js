const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Gio, GLib, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

const LOW_BATTERY_THRESHOLD = 10; // Set the low battery threshold (in percent)

const UPDATE_INTERVAL_SECONDS = 60; // Set the update interval (in seconds)

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

        this.updateBatteryStatus(); // Initial update

        // Create a separator to visually center the menu
        let separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator);

        // Create a menu item to enable RGB lighting
        let enableRGBItem = new PopupMenu.PopupMenuItem(_('Enable RGB Lighting'));
        enableRGBItem.connect('activate', () => {
            this.executeShellCommand('headsetcontrol -l 1');
        });
        this.menu.addMenuItem(enableRGBItem);

        // Add a spacer (visual separator)
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Create a menu item to disable RGB lighting
        let disableRGBItem = new PopupMenu.PopupMenuItem(_('Disable RGB Lighting'));
        disableRGBItem.connect('activate', () => {
            this.executeShellCommand('headsetcontrol -l 0');
        });
        this.menu.addMenuItem(disableRGBItem);

        // Set up a timer to update the battery status at regular intervals
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, UPDATE_INTERVAL_SECONDS, () => {
            this.updateBatteryStatus();
            return GLib.SOURCE_CONTINUE;
        });
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

                    // Check if battery is low and send a notification
                    if (percentage <= LOW_BATTERY_THRESHOLD) {
                        Main.notify('Low Battery', `Battery is at ${percentage}%`);
                    }
                    return;
                }
            }
        }

        // If the command doesn't produce the expected output, show an error message
        this.label.text = 'N/A';
    }

    executeShellCommand(command) {
        GLib.spawn_command_line_async(command);
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}

