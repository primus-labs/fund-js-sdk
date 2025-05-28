import { ethers } from 'ethers';
import { Attestation, ClaimParam, FundParam, RecipientBaseInfo, AttestParams, RefundParam } from './index.d'
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
                const result = await this._fund.init(provider, chainId, appId);
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
                    const formatSocialPlatform = i.socialPlatform.toLowerCase()
                    let formatUserIdentifier = i.userIdentifier

                    if (i.socialPlatform === "x" && i.userIdentifier.startsWith("@")) {
                       formatUserIdentifier = i.userIdentifier.slice(1);
                    }
                    
                    return {
                        nftIds: i.nftIds ?? [],
                        socialPlatform: formatSocialPlatform,
                        userIdentifier: formatUserIdentifier,
                        tokenAmount: i.tokenAmount
                    }
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

    async approve(fundParam: FundParam) {
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
                    const formatSocialPlatform = i.socialPlatform.toLowerCase()
                    let formatUserIdentifier = i.userIdentifier

                    if (i.socialPlatform === "x" && i.userIdentifier.startsWith("@")) {
                       formatUserIdentifier = i.userIdentifier.slice(1);
                    }
                    
                    return {
                        nftIds: i.nftIds ?? [],
                        socialPlatform: formatSocialPlatform,
                        userIdentifier: formatUserIdentifier,
                        tokenAmount: i.tokenAmount
                    }
                })
                
                const result = await this._fund?.approve(tokenInfo, newFundRecipientInfos);
                return resolve(result);
               
            } catch (error) {
                // console.error('fund-jssdk fund error', error)
                return reject(error);
            }
        });
    }
    async onlyFund(fundParam: FundParam) {
        
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
                    const formatSocialPlatform = i.socialPlatform.toLowerCase()
                    let formatUserIdentifier = i.userIdentifier

                    if (i.socialPlatform === "x" && i.userIdentifier.startsWith("@")) {
                       formatUserIdentifier = i.userIdentifier.slice(1);
                    }
                    
                    return {
                        nftIds: i.nftIds ?? [],
                        socialPlatform: formatSocialPlatform,
                        userIdentifier: formatUserIdentifier,
                        tokenAmount: i.tokenAmount
                    }
                })
                
                const result = await this._fund?.onlyFund(tokenInfo, newFundRecipientInfos[0]);
                return resolve(result);
                
            } catch (error) {
                // console.error('fund-jssdk fund error', error)
                return reject(error);
            }
        });
    }

    async refund(recipients: RefundParam[]) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!recipients || recipients.length === 0) {
                    return reject('recipients is empty')
                }
                const newRecipients = recipients.map(i => {
                    i.socialPlatform = i.socialPlatform.toLowerCase()
                    if (i.socialPlatform === "x" && i.userIdentifier.startsWith("@")) {
                        i.userIdentifier = i.userIdentifier.slice(1);
                    }
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


    async attest(attestParams: AttestParams, genAppSignature: (signParams: string) => Promise<string>, backUrl?:string): Promise<Attestation | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                const { socialPlatform } = attestParams
                const lcSocialPlatform = socialPlatform.toLowerCase()
                const attestation = await this._fund?.attest({
                    ...attestParams,
                    socialPlatform: lcSocialPlatform
                }, genAppSignature, backUrl);
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
                if (socialPlatforms[i]=== "x" && userIdentifiers[i].startsWith("@")) {
                    claimParamList[i].userIdentifier = claimParamList[i].userIdentifier.slice(1);
                }
            }
            
            if (socialPlatforms.length !== userIdentifiers.length || socialPlatforms.length !== attestations.length) {
                return reject(`claimParams is wrong`)
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

    async getFundRecords(getFundRecordsParams: RecipientBaseInfo) {
        const queryList = Array.isArray(getFundRecordsParams) ? getFundRecordsParams : [getFundRecordsParams];
        return new Promise(async (resolve, reject) => {
            if(!queryList || queryList?.length===0){
               const error = new Error('getFundRecordsParams is empty');
               return reject(error)
            }
            const socialPlatforms: string[] = [];
            const userIdentifiers: string[] = [];
        
            for (let i = 0; i < queryList.length ; i++) {
                socialPlatforms[i] = queryList[i].socialPlatform.toLowerCase();
                userIdentifiers[i] = queryList[i].userIdentifier;
                if (socialPlatforms[i]=== "x" && userIdentifiers[i].startsWith("@")) {
                    queryList[i].userIdentifier = queryList[i].userIdentifier.slice(1);
                }
            }
            
            if (socialPlatforms.length !== userIdentifiers.length) {
                return reject(`getFundRecordsParams is wrong`)
            }
            try {
                const result = await this._fund?.getTipRecords(queryList);
                resolve(result);
            } catch (error) {
                // console.log('fund-jssdk getFundRecords error:', error)
                return reject(error)
            }
        });
    }

}

export { PrimusFund };
