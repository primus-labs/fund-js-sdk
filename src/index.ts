import { ethers } from 'ethers';
import { Attestation, ClaimTipParam, TipParam } from './index.d'
import { Tip } from "./classes/Tip";

export * from './index.d'

class PrimusTip {
    private _tip: Tip | undefined;
    public supportedChainIds: number[] = [10143];
    public supportedDataSourceIds: string[] = ['x', 'tiktok'];
    private _dataSourceTemplateMap: {[propName:string]: string} = {
        x: 'ff90cc7c-a382-4d31-ad3e-20fb403c191a',
        tiktok: '7bf88aa3-0b01-429a-8aad-e880e25272c1'
    };
    constructor() {

    }

    async init(provider: any, appId: string, chainId: number) {
        return new Promise(async (resolve, reject) => {
            try {
                this._tip = new Tip();
                const result = await this._tip.init(new ethers.providers.Web3Provider(provider), appId, chainId);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


    async tip(tipParam: TipParam) {
        return new Promise(async (resolve, reject) => {
            try {
                const { tipToken, tipRecipientInfo } = tipParam;
                
                if (!tipRecipientInfo || tipRecipientInfo.length === 0) {
                    reject('tipRecipientInfo is empty')
                }
                if (tipToken.tokenType === 1) {
                    tipToken.tokenAddress = ethers.constants.AddressZero
                }
                tipRecipientInfo.map(i => {
                    i.nftIds = []
                })
                if (tipRecipientInfo.length === 1) {
                    const result = await this._tip?.tip(tipToken, tipRecipientInfo[0]);
                    resolve(result);
                } else if (tipRecipientInfo.length > 1) {
                    const result = await this._tip?.tipBatch(tipToken, tipRecipientInfo);
                    resolve(result);
                }
            } catch (error) {
                console.error('tip-jssdk tip error', error)
                reject(error);
            }
        });
    }

    async attest(idSource: string, address: string, genAppSignature: (signParams: string) => Promise<string>): Promise<Attestation | undefined> {
        return new Promise(async (resolve, reject) => {
            try { 
                const templateId = this._dataSourceTemplateMap[idSource]
                const attestation = await this._tip?.attest(templateId, address, genAppSignature);
                resolve(attestation)
            } catch (error) {
                console.log('tip-jssdk attest error:', error)
                reject(error)
            }
        });
    }

    async claimBySource(claimTipParams: ClaimTipParam[] | ClaimTipParam) {
        const claimTipParamList = Array.isArray(claimTipParams) ? claimTipParams : [claimTipParams];
        return new Promise(async (resolve, reject) => {
            if(!claimTipParamList || claimTipParamList?.length===0){
               const error = new Error('claimTipParamList is empty');
               reject(error)
            }
            const idSources: string[] = [];
            const ids: string[] = [];
            const attestations: Attestation[] = [];
        
            for (let i = 0; i < claimTipParamList.length ; i++) {
                idSources[i] = claimTipParamList[i].idSource;
                attestations[i] = claimTipParamList[i].attestation;
                ids[i] = claimTipParamList[i].id;
            }
            
            if (idSources.length !== ids.length || idSources.length !== attestations.length) {
                reject(`claimTipParamList is wrong`)
            }
            try {
                if (idSources.length === 1) {
                    const tipIndex = claimTipParamList[0].tipIndex
                    const result = await this._tip?.claimBySource(idSources[0],ids[0], attestations[0], tipIndex);
                    resolve(result);
                } else if (idSources.length > 1) {
                    const result = await this._tip?.claimByMultiSource(idSources, ids, attestations);
                    resolve(result);
                }
            } catch (error) {
                console.log('tip-jssdk claimBySource error:', error)
                reject(error)
            }
        });
    }

}

export { PrimusTip };
