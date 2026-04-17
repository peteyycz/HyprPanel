import { bind, Variable } from 'astal';
import { Gtk } from 'astal/gtk3';
import NM from 'gi://NM?version=1.0';
import Spinner from 'src/components/shared/Spinner';
import { NetworkService } from 'src/services/network';

const networkService = NetworkService.getInstance();

const VPN_ICON = '󰖂';

interface VpnConnectionProps {
    connection: NM.RemoteConnection;
}

export const VpnConnection = ({ connection }: VpnConnectionProps): JSX.Element => {
    const uuid = connection.get_uuid() ?? '';
    const name = connection.get_id() ?? '';

    const derivedVars: Variable<unknown>[] = [];

    const isActiveVar = Variable.derive(
        [bind(networkService.vpn.activeIds)],
        (activeIds) => activeIds.has(uuid),
    );
    derivedVars.push(isActiveVar);

    const iconClassVar = Variable.derive([bind(isActiveVar)], (isActive) => {
        return `network-icon vpn ${isActive ? 'active' : ''} txt-icon`;
    });
    derivedVars.push(iconClassVar);

    const showSpinnerVar = Variable.derive(
        [bind(networkService.vpn.connecting)],
        (connectingId) => connectingId === uuid,
    );
    derivedVars.push(showSpinnerVar);

    let isDestroying = false;

    return (
        <button
            className="network-element-item"
            onClick={() => {
                networkService.vpn.toggle(connection);
            }}
            setup={(self) => {
                self.connect('unrealize', () => {
                    if (!isDestroying) {
                        isDestroying = true;
                        derivedVars.forEach((v) => v.drop());
                    }
                });
            }}
        >
            <box hexpand>
                <label
                    valign={Gtk.Align.START}
                    className={bind(iconClassVar)}
                    label={VPN_ICON}
                />
                <box
                    className="connection-container"
                    valign={Gtk.Align.CENTER}
                    vertical
                    hexpand
                >
                    <label
                        className="active-connection"
                        valign={Gtk.Align.CENTER}
                        halign={Gtk.Align.START}
                        truncate
                        wrap
                        label={name}
                    />
                    <revealer revealChild={bind(isActiveVar)}>
                        <label
                            className="connection-status dim"
                            halign={Gtk.Align.START}
                            label={'Connected'}
                        />
                    </revealer>
                </box>
                <revealer
                    halign={Gtk.Align.END}
                    valign={Gtk.Align.CENTER}
                    revealChild={bind(showSpinnerVar)}
                >
                    <Spinner
                        className="spinner wap"
                        setup={(self: Gtk.Spinner) => {
                            self.start();
                        }}
                        halign={Gtk.Align.CENTER}
                        valign={Gtk.Align.CENTER}
                    />
                </revealer>
            </box>
        </button>
    );
};
