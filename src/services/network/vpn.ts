import { Variable } from 'astal';
import AstalNetwork from 'gi://AstalNetwork?version=0.1';
import NM from 'gi://NM?version=1.0';

const VPN_CONNECTION_TYPES = ['vpn', 'wireguard'];

/**
 * VpnManager exposes NetworkManager-managed VPN connections and allows
 * toggling them on/off.
 */
export class VpnManager {
    private _nmClient: NM.Client;

    public connections: Variable<NM.RemoteConnection[]> = Variable([]);
    public activeIds: Variable<Set<string>> = Variable(new Set());
    public connecting: Variable<string> = Variable('');

    constructor(networkService: AstalNetwork.Network) {
        this._nmClient = networkService.client;
        this._setupNMSignals();
        this._refreshConnections();
        this._refreshActive();
    }

    private _setupNMSignals(): void {
        this._nmClient.connect('connection-added', () => {
            this._refreshConnections();
        });

        this._nmClient.connect('connection-removed', () => {
            this._refreshConnections();
        });

        this._nmClient.connect('active-connection-added', () => {
            this._refreshActive();
        });

        this._nmClient.connect('active-connection-removed', () => {
            this._refreshActive();
        });
    }

    private _isVpnConnectionType(type: string | null): boolean {
        return type !== null && VPN_CONNECTION_TYPES.includes(type);
    }

    private _refreshConnections(): void {
        try {
            const vpns = this._nmClient
                .get_connections()
                .filter((c) => this._isVpnConnectionType(c.get_connection_type()));
            this.connections.set(vpns);
        } catch (err) {
            console.error('Error refreshing VPN connections from NM:', err);
            this.connections.set([]);
        }
    }

    private _refreshActive(): void {
        try {
            const ids = new Set<string>();
            for (const ac of this._nmClient.get_active_connections()) {
                if (this._isVpnConnectionType(ac.get_connection_type())) {
                    const uuid = ac.get_uuid();
                    if (uuid) {
                        ids.add(uuid);
                    }
                }
            }
            this.activeIds.set(ids);
        } catch (err) {
            console.error('Error refreshing active VPN connections from NM:', err);
            this.activeIds.set(new Set());
        }
    }

    public isActive(uuid: string): boolean {
        return this.activeIds.get().has(uuid);
    }

    public toggle(connection: NM.RemoteConnection): void {
        const uuid = connection.get_uuid();
        if (!uuid) {
            return;
        }

        if (this.connecting.get() === uuid) {
            return;
        }

        this.connecting.set(uuid);

        if (this.isActive(uuid)) {
            this._deactivate(uuid);
        } else {
            this._activate(connection);
        }
    }

    private _activate(connection: NM.RemoteConnection): void {
        this._nmClient.activate_connection_async(
            connection,
            null,
            null,
            null,
            (client: NM.Client | null, result) => {
                try {
                    if (client) {
                        client.activate_connection_finish(result);
                    }
                } catch (err) {
                    console.error('Error activating VPN connection:', err);
                } finally {
                    this.connecting.set('');
                }
            },
        );
    }

    private _deactivate(uuid: string): void {
        const activeConn = this._nmClient
            .get_active_connections()
            .find((ac: NM.ActiveConnection) => ac.get_uuid() === uuid);

        if (!activeConn) {
            this.connecting.set('');
            return;
        }

        this._nmClient.deactivate_connection_async(
            activeConn,
            null,
            (client: NM.Client | null, result) => {
                try {
                    if (client) {
                        client.deactivate_connection_finish(result);
                    }
                } catch (err) {
                    console.error('Error deactivating VPN connection:', err);
                } finally {
                    this.connecting.set('');
                }
            },
        );
    }
}
