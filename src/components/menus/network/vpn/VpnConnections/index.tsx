import { bind } from 'astal/binding';
import NM from 'gi://NM?version=1.0';
import { NetworkService } from 'src/services/network';
import { VpnConnection } from './VpnConnection';

const networkService = NetworkService.getInstance();

export const VpnConnections = (): JSX.Element => {
    return (
        <box className={'available-vpns'} vertical>
            {bind(networkService.vpn.connections).as((connections) =>
                connections.map((connection: NM.RemoteConnection) => (
                    <VpnConnection connection={connection} />
                )),
            )}
        </box>
    );
};
