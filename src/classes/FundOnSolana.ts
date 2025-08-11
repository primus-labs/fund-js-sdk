import { ethers } from 'ethers';
import { Fund_CONTRACTS, NATIVETOKENS, CHAINNAMES } from "../config/constants";
import { Attestation, RecipientInfo, TokenInfo, RecipientBaseInfo, RefundParam, ERC20TokenInfo, ApproveParams } from '../index.d'
import Contract from './Contract';
import Erc20Contract from './Erc20Contract';
import abiJson from '../config/abi.json';
// import erc20Abi from '../config/erc20Abi.json';
import Erc721Contract from './Erc721Contract';
import { getProgram } from './solana/program';
import redPacketIdl from '../config/redPacketIdl.json'
const defaultDecimals = 9;
const { parseUnits, formatUnits } = ethers.utils;
class FundOnSolana {
  private fundContract!: any;
  private provider!: ethers.providers.Web3Provider;
  private formatProvider!: ethers.providers.Web3Provider;
  private chainId!: string;
  constructor() {
  }
  async init(provider: any, chainId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        this.fundContract = getProgram(redPacketIdl, provider);
        this.provider = provider;
        this.chainId = chainId;
        resolve('success');
      } catch (error) {
        return reject(error);
      }
    });
  }

  async fund(tokenInfo: TokenInfo, recipientInfo: RecipientInfo) {
    
    await testReSend({
      redEnvelopeProgram: this.fundContract,
      provider: this.provider,
      ...params
    })

    return new Promise(async (resolve, reject) => {
      try {
        const recipientInfos = [];
        recipientInfos[0] = recipientInfo;
        let decimals = defaultDecimals
        let params = []

        if (tokenInfo.tokenType === 0) {
          await this.approve(tokenInfo, recipientInfos)
          console.log('after approve in fund fn')
          const tokenContract = new Erc20Contract(this.provider, tokenInfo.tokenAddress);
          decimals = await tokenContract.decimals();
        } else if (tokenInfo.tokenType === 2) {
          decimals = 0;
          const erc721ContractInstance = new Erc721Contract(this.provider, tokenInfo.tokenAddress);
          await erc721ContractInstance.approve(this.fundContract.address, (recipientInfo.nftIds as any)[0])
        }

        const tokenAmount = parseUnits(recipientInfo.tokenAmount.toString(), decimals)
        // console.log('classes-Fund-fund',tokenAmount)
        const newFundRecipientInfo = {
          idSource: recipientInfo.socialPlatform,
          id: recipientInfo.userIdentifier,
          amount: tokenAmount,
          nftIds: recipientInfo.nftIds
        }

        if (tokenInfo.tokenType === 1) {
          params = [tokenInfo, newFundRecipientInfo, { value: tokenAmount }]
        } else {
          params = [tokenInfo, newFundRecipientInfo]
        }
        if ([97, 56].includes(this.chainId)) {
          const gasPrice = await this.provider.getGasPrice();
          params[2] = params[2] ? { ...params[2], gasPrice } :
            { gasPrice }
        }
        console.log('tip-params', params, this.chainId)


        const result = await this.fundContract.sendTransaction('tip', params)
        resolve(result);
      } catch (error) {
        return reject(error);
      }
    });


  }


  // async refund(recipients: RefundParam[]) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const newRecipients = recipients.map(i => {
  //         return {
  //           idSource: i.socialPlatform,
  //           id: i.userIdentifier,
  //           tipTimestamp: i.tipTimestamp
  //         }
  //       })
  //       let params = [newRecipients]
  //       if ([97, 56].includes(this.chainId)) {
  //         const gasPrice = await this.provider.getGasPrice();
  //         params.push({
  //           gasPrice
  //         })
  //       }
  //       const result = await this.fundContract.sendTransaction('tipperWithdraw', params)
  //       return resolve(result);
  //     } catch (error) {
  //       return reject(error);
  //     }
  //   });
  // }


  // async claimBySource(socialPlatform: string, userIdentifier: string, attestation: Attestation) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const claimFee = await this.fundContract.callMethod('claimFee', [])
  //       // console.log('claimFee', claimFee)]
  //       const fundRecords = await this.fundContract.callMethod('getTipRecords', [{ idSource: socialPlatform, id: userIdentifier }])
  //       console.log('fundRecords', fundRecords)
  //       const recordCount = fundRecords.length
  //       if (recordCount <= 0) {
  //         return reject(`No fund records.`)
  //       } else {
  //         const totalFee = claimFee.mul(recordCount)
  //         // console.log('totalFee', totalFee)

  //         let params = [socialPlatform, attestation, { value: totalFee }]
  //         if ([97, 56].includes(this.chainId)) {
  //           const gasPrice = await this.provider.getGasPrice();
  //           params[2].gasPrice = gasPrice
  //         }
  //         const txreceipt = await this.fundContract.sendTransaction('claimBySource', params)
  //         return resolve(txreceipt)
  //       }
  //     } catch (error) {
  //       // console.log('claimBySource', error)
  //       return reject(error)
  //     }
  //   });
  // }


  // async _formatTipRecords(fundRecords: any[]) {
  //   console.log('fundRecords', fundRecords)
  //   let formatRecords = []
  //   for (const record of fundRecords) {
  //     const { tipper, timestamp, tipToken: [tokenType, tokenAddress], amount, nftIds } = record
  //     let decimals = defaultDecimals
  //     let symbol = ''
  //     let tokenId = null
  //     let nftInfo = null
  //     if (tokenType === 0) {
  //       const tokenContract = new Erc20Contract(this.provider, tokenAddress);
  //       decimals = await tokenContract.decimals();
  //       symbol = await tokenContract.symbol();
  //     } else if (tokenType === 1) {
  //       symbol = NATIVETOKENS[this.chainId]
  //     } else if (tokenType === 2) {
  //       decimals = 0
  //       tokenId = parseInt(nftIds[0])
  //       const erc721ContractInstance = new Erc721Contract(this.provider, tokenAddress);
  //       nftInfo = await erc721ContractInstance.fetchMetaData(tokenAddress, tokenId)
  //     }

  //     let fundToken: any = {
  //       tokenType,
  //       // tokenAmount: formatUnits(amount, decimals),
  //       decimals,
  //       symbol,
  //       chainName: CHAINNAMES[this.chainId],
  //       chainId: this.chainId
  //     }
  //     if (tokenType === 0) {
  //       fundToken.tokenAddress = tokenAddress
  //     }
  //     if (tokenType === 2) {
  //       Object.assign(fundToken, nftInfo ?? {})
  //     }
  //     formatRecords.push({
  //       funder: tipper,
  //       fundToken,
  //       amount: formatUnits(amount, decimals),
  //       timestamp: timestamp.toNumber()
  //     })
  //   }
  //   console.log('formatRecords', formatRecords)
  //   return formatRecords
  // }

  // async getTipRecords(getFundRecordsParams: RecipientBaseInfo[]) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const formatGetFundRecordsParams = getFundRecordsParams.map(item => {
  //         return {
  //           idSource: item.socialPlatform,
  //           id: item.userIdentifier
  //         }
  //       })
  //       const fundRecords = await this.fundContract.callMethod('getTipRecords', formatGetFundRecordsParams)
  //       let formatRecords = await this._formatTipRecords(fundRecords)
  //       return resolve(formatRecords)
  //     } catch (error) {
  //       // console.log('getTipRecords', error)
  //       return reject(error)
  //     }
  //   });
  // }

}

export { FundOnSolana };
