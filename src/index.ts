import {ethers} from 'ethers';
import {Attestation, ClaimTipParam, TipParam} from './index.d'
import {Tip} from "./classes/Tip";

export * from './index.d'

class PrimusTipClient {
    private _tip: Tip | undefined;

    constructor() {

    }

    async init(provider: any, appId: string, appSecret?: string) {
        this._tip = new Tip();
        //TODO new ethers.providers.Web3Provider(provider)?
        await this._tip.init(new ethers.providers.Web3Provider(provider), appId, appSecret);
    }


    async tip(tipParam: TipParam) {
        const tipToken = tipParam.tipToken;
        const tipRecipientInfo = tipParam.tipRecipientInfo;
        if (!tipRecipientInfo || tipRecipientInfo.length === 0) {
            throw new Error('tipRecipientInfo is empty');
        }
        if (tipRecipientInfo.length === 1) {
            await this._tip?.tip(tipToken, tipRecipientInfo[0]);
            return;
        }
        await this._tip?.tipBatch(tipToken, tipRecipientInfo);

    }

    async attest(templateId: string, attConditions: any[]): Promise<Attestation | undefined> {
        return this._tip?.attest(templateId, attConditions);
    }

    async claimBySource(claimTipParam: ClaimTipParam[]) {
        if(!claimTipParam || claimTipParam?.length===0){
            throw new Error('claimTipParam is empty');
        }
        const idSources: string[] = [];
        const attestations: Attestation[] = [];
        for (let i = 0; i < claimTipParam.length ; i++) {
            idSources[i] = claimTipParam[i].idSource;
            attestations[i] = claimTipParam[i].attestation;
        }
        if(idSources.length===1){
            await this._tip?.claimBySource(idSources[0], attestations[0]);
            return;
        }
        await this._tip?.claimByMultiSource(idSources, attestations);
    }

}

export {PrimusTipClient};
