import { ethers } from 'ethers';
import { Attestation, ClaimParam, FundParam, RecipientBaseInfo } from './index.d'
import { Fund } from "./classes/Fund";
import { SUPPORTEDCHAINIDS, SUPPORTEDSOCIALPLATFORMS } from './config/constants'

export * from './index.d'

class PrimusFund {
    public supportedChainIds = SUPPORTEDCHAINIDS;
    public supportedSocialPlatforms = SUPPORTEDSOCIALPLATFORMS;
    private _fund: Fund | undefined;

    async init(provider: any, chainId: number, appId?: string) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.supportedChainIds.includes(chainId)) {
                    return reject('chainId is not supported')
                }
                this._fund = new Fund();
                const result = await this._fund.init(new ethers.providers.Web3Provider(provider), chainId, appId );
                return resolve(result);
            } catch (error) {
                return reject(error);
            }
        });
    }


    async fund(fundParam: FundParam) {
        return new Promise(async (resolve, reject) => {
            try {
                const { tokenInfo, recipientInfos } = fundParam;
                
                if (!recipientInfos || recipientInfos.length === 0) {
                    return reject('recipientInfos is empty')
                }
                const hasUnsupportedSocialPlatforms = recipientInfos.some(i => !this.supportedSocialPlatforms.includes(i.socialPlatform.toLowerCase()));
                if (hasUnsupportedSocialPlatforms) {
                    return reject('socialPlatform is not supported')
                }
                if (tokenInfo.tokenType === 1) {
                    tokenInfo.tokenAddress = ethers.constants.AddressZero
                }
                const newFundRecipientInfos = recipientInfos.map(i => {
                    i.nftIds = []
                    i.socialPlatform = i.socialPlatform.toLowerCase()
                    return i
                })
                if (recipientInfos.length === 1) {
                    const result = await this._fund?.fund(tokenInfo, newFundRecipientInfos[0]);
                    return resolve(result);
                } else if (recipientInfos.length > 1) {
                    const result = await this._fund?.fundBatch(tokenInfo, newFundRecipientInfos);
                    return resolve(result);
                }
            } catch (error) {
                // console.error('fund-jssdk fund error', error)
                return reject(error);
            }
        });
    }

    async refund(recipients: RecipientBaseInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!recipients || recipients.length === 0) {
                    return reject('recipients is empty')
                }
                const newRecipients = recipients.map(i => {
                    i.socialPlatform = i.socialPlatform.toLowerCase()
                    return i
                })
                const result = await this._fund?.refund(newRecipients);
                return resolve(result);
            
            } catch (error) {
                // console.error('fund-jssdk fund error', error)
                return reject(error);
            }
        });
    }


    async attest(socialPlatform: string, address: string, genAppSignature: (signParams: string) => Promise<string>): Promise<Attestation | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                const lcSocialPlatform = socialPlatform.toLowerCase()
                const attestation = await this._fund?.attest(lcSocialPlatform, address, genAppSignature);
                return resolve(attestation)
            } catch (error) {
                // console.log('fund-jssdk attest error:', error)
                return reject(error)
            }
        });
    }

    async claim(claimParams: ClaimParam[] | ClaimParam) {
        const claimParamList = Array.isArray(claimParams) ? claimParams : [claimParams];
        return new Promise(async (resolve, reject) => {
            if(!claimParamList || claimParamList?.length===0){
               const error = new Error('claimParams is empty');
               return reject(error)
            }
            const socialPlatforms: string[] = [];
            const userIdentifiers: string[] = [];
            const attestations: Attestation[] = [];
        
            for (let i = 0; i < claimParamList.length ; i++) {
                socialPlatforms[i] = claimParamList[i].socialPlatform.toLowerCase();
                attestations[i] = claimParamList[i].attestation;
                userIdentifiers[i] = claimParamList[i].userIdentifier;
            }
            
            if (socialPlatforms.length !== userIdentifiers.length || socialPlatforms.length !== attestations.length) {
                return reject(`claimParamList is wrong`)
            }
            try {
                if (socialPlatforms.length === 1) {
                    // const fundIndex = claimParamList[0].fundIndex
                    const result = await this._fund?.claimBySource(socialPlatforms[0], userIdentifiers[0], attestations[0]);
                    resolve(result);
                } else if (socialPlatforms.length > 1) {
                    const result = await this._fund?.claimByMultiSource(socialPlatforms, userIdentifiers, attestations);
                    return resolve(result);
                }
            } catch (error) {
                // console.log('fund-jssdk claimBySource error:', error)
                return reject(error)
            }
        });
    }

}

export { PrimusFund };
