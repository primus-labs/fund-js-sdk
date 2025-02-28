import {ethers} from 'ethers';
import {Attestation, ClaimTipParam, claimTipParam, TipParam, TipRecipientInfo, TipToken} from './index.d'
import {Tip} from "classes/Tip";

class PrimusTipClient {
    private _tip: Tip | undefined;

    constructor() {

    }

    async init(wallet: ethers.Wallet, appId: string, appSecret?: string) {
        this._tip = new Tip();
        await this._tip.init(wallet, appId, appSecret);
    }


    async tip(tipParam: TipParam) {

    }

    async attest(templateId: string, attConditions: any[]) {

    }

    async claimBySource(claimTipParam: ClaimTipParam[]) {

    }

}

export {PrimusTipClient};
