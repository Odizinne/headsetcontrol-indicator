const { GObject, St, Gio, GLib, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let timerSourceId = null;
const UPDATE_INTERVAL_SECONDS = 5;

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('HeadsetControl Indicator'));

        const container = new St.BoxLayout({ style_class: 'panel-status-menu-box' });

        const iconBin = new St.Bin();
        iconBin.child = new St.Icon({
            icon_name: 'audio-headset-symbolic',
            style_class: 'system-status-icon',
        });

        const labelBin = new St.Bin();
        labelBin.child = new St.Label({ text: '' });
        labelBin.y_align = Clutter.ActorAlign.CENTER;

        container.add_child(iconBin);
        container.add_child(labelBin);

        this.add_child(container);

        this.label = labelBin.child;
        this.rgbEnabled = false;

        this.enableRGBItem = new PopupMenu.PopupMenuItem(_('Enable RGB Lighting'));
        this.enableRGBItem.connect('activate', () => {
            GLib.spawn_command_line_sync('headsetcontrol -l 1');
        });
        this.menu.addMenuItem(this.enableRGBItem);

        this.disableRGBItem = new PopupMenu.PopupMenuItem(_('Disable RGB Lighting'));
        this.disableRGBItem.connect('activate', () => {
            GLib.spawn_command_line_sync('headsetcontrol -l 0');
        });
        this.menu.addMenuItem(this.disableRGBItem);

        this.updateBatteryStatus();

        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, UPDATE_INTERVAL_SECONDS, () => {
            this.updateBatteryStatus();
            return GLib.SOURCE_CONTINUE;
        });
    }

    updateBatteryStatus() {
        const [ok, stdout, stderr] = GLib.spawn_command_line_sync('headsetcontrol -o json');
        if (ok) {
            const output = JSON.parse(stdout.toString());

            if (output.devices && output.devices.length > 0) {
                const battery = output.devices[0].battery;

                switch (battery.status) {
                    case 'BATTERY_UNAVAILABLE':
                        this.label.text = 'Off';
                        break;
                    case 'BATTERY_CHARGING':
                        this.label.text = 'Charging';
                        break;
                    case 'BATTERY_AVAILABLE':
                        this.label.text = `${battery.level}%`;
                        break;
                    default:
                        this.label.text = '';
                        break;
                }
            }
        } else {
            log(`Failed to execute headsetcontrol: ${stderr}`);
        }
    }
});

    function removeTimer() {
        if (timerSourceId !== null) {
            GLib.SOURCE_REMOVE(timerSourceId);
            timerSourceId = null;
        }
    }

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator, 2, 'left');
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        removeTimer();
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}

