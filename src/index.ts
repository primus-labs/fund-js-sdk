import { ethers } from 'ethers';
import { Attestation, ClaimParam, FundParam, RecipientBaseInfo, AttestParams, RefundParam, FundForRedPacketParam, RedPacketId, AttestCommonParams,FundERC20ForRedPacketParam } from './index.d'
import { Fund } from "./classes/Fund";
import { FundForRedPacket } from "./classes/FundForRedPacket";
import { ZktlsSdk } from "./classes/ZktlsSdk";
import { SUPPORTEDCHAINIDS, SUPPORTEDSOCIALPLATFORMS } from './config/constants'

export * from './index.d'
class PrimusFund {
  public supportedChainIds = SUPPORTEDCHAINIDS;
  public supportedSocialPlatforms = SUPPORTEDSOCIALPLATFORMS;
  private provider!: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | ethers.providers.JsonRpcSigner;
  private _fund: Fund | undefined;
  private _fundForRedPacket: FundForRedPacket | undefined;
  private _zkTlsSdk: ZktlsSdk | undefined;
  async init(provider: any, chainId: number, appId?: string) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.supportedChainIds.includes(chainId)) {
          return reject('chainId is not supported')
        }
        let formatProvider;
        let signer;
        if (provider instanceof ethers.providers.JsonRpcProvider) {
          // console.log('provider is JsonRpcProvider')
          formatProvider = provider;
        } else {
          // console.log('provider is Web3Provider')
          formatProvider = new ethers.providers.Web3Provider(provider)
          signer = formatProvider.getSigner();
        }
        await formatProvider.ready;
        const network = await formatProvider.getNetwork();
        const providerChainId = network.chainId;
        console.log('init provider', provider, network)
        console.log('init providerChainId', providerChainId, chainId)
        if (providerChainId !== chainId) {
          return reject(`Please connect to the chain with ID ${chainId} first.`)
        }
        this.provider = signer ?? formatProvider;
        this._fund = new Fund();
        const result = await this._fund.init(this.provider, chainId);
        this._fundForRedPacket = new FundForRedPacket();
        await this._fundForRedPacket.init(this.provider, chainId);
        if (appId) {
          this._zkTlsSdk = new ZktlsSdk();
          await this._zkTlsSdk.init(appId);
        }
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


  async attest(attestParams: AttestParams, genAppSignature: (signParams: string) => Promise<string>, backUrl?: string): Promise<Attestation | undefined> {
    return new Promise(async (resolve, reject) => {
      try {
        const { socialPlatform } = attestParams
        const lcSocialPlatform = socialPlatform.toLowerCase()
        const attestation = await this._zkTlsSdk?.attest({
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
      if (!claimParamList || claimParamList?.length === 0) {
        const error = new Error('claimParams is empty');
        return reject(error)
      }
      const socialPlatforms: string[] = [];
      const userIdentifiers: string[] = [];
      const attestations: Attestation[] = [];

      for (let i = 0; i < claimParamList.length; i++) {
        socialPlatforms[i] = claimParamList[i].socialPlatform.toLowerCase();
        attestations[i] = claimParamList[i].attestation;
        userIdentifiers[i] = claimParamList[i].userIdentifier;
        if (socialPlatforms[i] === "x" && userIdentifiers[i].startsWith("@")) {
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
      if (!queryList || queryList?.length === 0) {
        const error = new Error('getFundRecordsParams is empty');
        return reject(error)
      }
      const socialPlatforms: string[] = [];
      const userIdentifiers: string[] = [];

      for (let i = 0; i < queryList.length; i++) {
        socialPlatforms[i] = queryList[i].socialPlatform.toLowerCase();
        userIdentifiers[i] = queryList[i].userIdentifier;
        if (socialPlatforms[i] === "x" && userIdentifiers[i].startsWith("@")) {
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

  async fundForRedPacket(fundParam: FundForRedPacketParam) {
    return new Promise(async (resolve, reject) => {
      try {
        const { tokenInfo, sendParam } = fundParam;
        const result = await this._fundForRedPacket?.fundForRedPacket(tokenInfo, sendParam);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  async onlyFundForRedPacket(fundParam: FundForRedPacketParam) {
    return new Promise(async (resolve, reject) => {
      try {
        const { tokenInfo, sendParam } = fundParam;
        const result = await this._fundForRedPacket?.onlyFundForRedPacket(tokenInfo, sendParam);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  async withdrawForRedPacket(redPacketId: RedPacketId) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this._fundForRedPacket?.withdrawForRedPacket(redPacketId);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  async getRedPacketInfo(redPacketId: RedPacketId) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this._fundForRedPacket?.getRedPacketInfo(redPacketId);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  async approveForRedPacket(fundParam: FundERC20ForRedPacketParam ) {
    return new Promise(async (resolve, reject) => {
      try {
        const { tokenInfo, sendParam: { amount } } = fundParam
        const result = await this._fundForRedPacket?.approveForRedPacket(tokenInfo, amount);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  async claimForRedPacket(redPacketId: RedPacketId, attestation: Attestation) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this._fundForRedPacket?.claimForRedPacket(redPacketId, attestation);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  async attestCommon(attestParams: AttestCommonParams): Promise<Attestation | undefined> {
    return new Promise(async (resolve, reject) => {
      try {
        const attestation = await this._zkTlsSdk?.attestCommon(attestParams);
        return resolve(attestation)
      } catch (error) {
        // console.log('fund-jssdk attest error:', error)
        return reject(error)
      }
    });
  }
}

export { PrimusFund };
