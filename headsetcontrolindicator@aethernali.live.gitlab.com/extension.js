const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Gio, GLib, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

const UPDATE_INTERVAL_SECONDS = 5; // Set the update interval (in seconds)

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        const container = new St.BoxLayout({ style_class: 'panel-status-menu-box' });

        // Create a bin for headset the icon
        const iconBin = new St.Bin();
        iconBin.child = new St.Icon({
            icon_name: 'audio-headset-symbolic',
            style_class: 'system-status-icon',
        });

        // Create a bin for the label
        const labelBin = new St.Bin();
        labelBin.child = new St.Label({ text: '' });
        labelBin.y_align = Clutter.ActorAlign.CENTER;

        // Add the icon bin and icon charging bin next to each other
        container.add_child(iconBin);
        container.add_child(labelBin);

        this.add_child(container);

        this.label = labelBin.child;
        this.rgbEnabled = false; // Initialize RGB capability status

        // Create a menu item to enable RGB lighting
        this.enableRGBItem = new PopupMenu.PopupMenuItem(_('Enable RGB Lighting'));
        this.enableRGBItem.connect('activate', () => {
            GLib.spawn_command_line_sync('headsetcontrol -l 1');
        });
        this.menu.addMenuItem(this.enableRGBItem);
        this.enableRGBItem.actor.hide(); // Initially hide the menu item

        // Create a menu item to disable RGB lighting
        this.disableRGBItem = new PopupMenu.PopupMenuItem(_('Disable RGB Lighting'));
        this.disableRGBItem.connect('activate', () => {
            GLib.spawn_command_line_sync('headsetcontrol -l 0');
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
        let status = '';

        for (const line of outputLines) {
            if (line.startsWith('Battery:')) {
                if (line.includes('Charging')) {
                    status = 'Charging';
                } else {
                    const batteryPercentage = line.match(/\d+/);
                    if (batteryPercentage) {
                        const percentage = parseInt(batteryPercentage[0], 10);
                        status = `${percentage}%`;
                    } else {
                        status= 'N/A';
                    }
                }
                this.label.text = status;
                return;
            }
        }
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

