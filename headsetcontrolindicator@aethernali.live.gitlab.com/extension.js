import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';


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

        this.chargingIconBin = new St.Bin({ style_class: 'panel-status-icon' });
        this.chargingIconBin.child = new St.Icon({ style_class: 'system-status-icon' });

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

        GLib.spawn_command_line_sync('headsetcontrol -l 0'); // Disable RGB lighting by default, personal preference, you can remove it if you want
        this.updateBatteryStatus();

        timerSourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, UPDATE_INTERVAL_SECONDS, () => {
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
                        this.chargingIconBin.child.icon_name = 'battery-missing-symbolic';
                        this.label.text = 'Off';
                        break;
                    case 'BATTERY_CHARGING':
                        this.chargingIconBin.child.icon_name = 'battery-full-charging-symbolic';
                        this.label.text = 'Charging';
                        break;
                    case 'BATTERY_AVAILABLE':
                        this.chargingIconBin.child.icon_name = 'battery-full-symbolic';
                        this.label.text = `${battery.level}%`;
                        break;
                    default:
                        this.chargingIconBin.child.icon_name = 'battery-missing-symbolic';
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
        GLib.Source.remove(timerSourceId);
        timerSourceId = null;
    }
}

export default class MyIndicatorExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel._leftBox.insert_child_at_index(this._indicator.container, 1);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        removeTimer();
    }
}
