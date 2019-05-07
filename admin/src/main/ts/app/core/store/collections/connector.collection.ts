import { ConnectorModel } from '..';
import { Collection, Mix } from 'entcore-toolkit';

export class ConnectorCollection extends Collection<ConnectorModel> {

    constructor(){
        super({});
    }

    syncConnectors = () => {
        return this.http.get(`/appregistry/external-applications?structureId=${this.structureId}`)
            .then(res => {
                let connectors = new Array();
                res.data.forEach(connector => {
                    connectors.push({
                        id: connector.data.id,
                        name: connector.data.name,
                        displayName: connector.data.displayName,
                        icon: connector.data.icon,
                        url: connector.data.address,
                        target: connector.data.target,
                        inherits: connector.data.inherits,
                        locked: connector.data.appLocked,
                        casTypeId: connector.data.casType,
                        casPattern: connector.data.pattern,
                        oauthScope: connector.data.scope,
                        oauthSecret: connector.data.secret,
                        oauthGrantType: connector.data.grantType
                    })
                });
                this.data = Mix.castArrayAs(ConnectorModel, connectors);
            })
    }
    
    public structureId : string;
}