import { Gtk } from 'astal/gtk3';
import { bind } from 'astal/binding';
import { NetworkService } from 'src/services/network';
import { VpnConnections } from './VpnConnections';

const networkService = NetworkService.getInstance();

export const Vpn = (): JSX.Element => {
    return (
        <box
            className={'menu-section-container vpn'}
            vertical
            visible={bind(networkService.vpn.connections).as((c) => c.length > 0)}
        >
            <box className={'menu-label-container'} halign={Gtk.Align.FILL}>
                <label className={'menu-label'} halign={Gtk.Align.START} hexpand label={'VPN'} />
            </box>
            <box className={'menu-items-section'} vertical>
                <VpnConnections />
            </box>
        </box>
    );
};
