import { ethers } from 'ethers';

import { FundForRedPacket_CONTRACTS } from "../config/constants";
import { Attestation, TokenInfo, SendForRedPacketParam, RedPacketId, ERC20TokenInfo, ApproveParams } from '../index.d';
import Contract from './Contract';
import Erc20Contract from './Erc20Contract';
import abiJson from '../config/abiForRedPacket.json';

const { parseUnits } = ethers.utils;

class FundForRedPacket {
  private fundContract!: any;
  private provider!: ethers.providers.Web3Provider;
  private formatProvider!: ethers.providers.Web3Provider;
  private chainId!: number;
  constructor() {
  }

  async init(provider: any, chainId: number) {
    return new Promise(async (resolve, reject) => {
      try {
        let formatProvider: any;
        if (provider instanceof ethers.providers.JsonRpcProvider) {
          formatProvider = provider;
        } else {
          formatProvider = new ethers.providers.Web3Provider(provider)
        }

        await formatProvider.ready;
        const network = await formatProvider.getNetwork();
        const providerChainId = network.chainId;
        console.log('init provider', provider, network)
        console.log('init providerChainId', providerChainId, chainId)
        if (providerChainId !== chainId) {
          return reject(`Please connect to the chain with ID ${chainId} first.`)
        }
        const fundContractAddress = FundForRedPacket_CONTRACTS[chainId];
        if (!fundContractAddress) {
          return reject(`Unsupported chainId:${chainId}`)
        }
        this.fundContract = new Contract(provider, fundContractAddress, abiJson);
        this.provider = provider;
        this.formatProvider = formatProvider
        this.chainId = chainId;
        resolve('success');
      } catch (error) {
        return reject(error);
      }
    });
  }

  async fundForRedPacket(tokenInfo: TokenInfo, sendParam: SendForRedPacketParam) {
    return new Promise(async (resolve, reject) => {
      try {
        let decimals = 18
        let params = []
        if (tokenInfo.tokenType === 0) {
          await this.approve(tokenInfo, sendParam.amount)
          console.log('after approve in fund fn')
          const tokenContract = new Erc20Contract(this.provider, tokenInfo.tokenAddress);
          decimals = await tokenContract.decimals();
        }
        if (tokenInfo.tokenType === 1) {
          tokenInfo.tokenAddress = ethers.constants.AddressZero
        }
        const formatSendAmount = parseUnits(sendParam.amount.toString(), decimals);
        const formatSendParam = {
          ...sendParam,
          amount: formatSendAmount,
        }

        if (tokenInfo.tokenType === 1) {
          params = [tokenInfo, formatSendParam, { value: formatSendAmount }]
        } else {
          params = [tokenInfo, formatSendParam]
        }
        if ([97, 56].includes(this.chainId)) {
          const gasPrice = await this.formatProvider.getGasPrice();
          params[2] = params[2] ? { ...params[2], gasPrice } :
            { gasPrice }
        }
        console.log('tipForRedPacket-params', params, this.chainId)
        const result = await this.fundContract.sendTransaction('reSend', params)
        resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }


  async withdrawForRedPacket(redPacketId: RedPacketId) {
    return new Promise(async (resolve, reject) => {
      try {
        let params = [redPacketId]
        if ([97, 56].includes(this.chainId)) {
          const gasPrice = await this.formatProvider.getGasPrice();
          params.push({
            gasPrice
          })
        }
        const result = await this.fundContract.sendTransaction('reSenderWithdraw', params)
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }


  async approveForRedPacket(tokenInfo: ERC20TokenInfo, approveAmount: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const tokenContract = new Erc20Contract(this.provider, tokenInfo.tokenAddress);
        let approveParams: ApproveParams = {
          spenderAddress: this.fundContract.address,
          approveAmount
        }
        if ([97, 56].includes(this.chainId)) {
          const gasPrice = await this.formatProvider.getGasPrice();
          approveParams.otherParams = { gasPrice }
        }
        await tokenContract.approve(approveParams)
        resolve('Approved');
      } catch (error: any) {
        return reject(error);
      }
    });
  }

  async claimForRedPacket(redPacketId: RedPacketId, attestation: Attestation) {
    return new Promise(async (resolve, reject) => {
      try {
        const claimFee = await this.fundContract.callMethod('claimFee', [])
        let params = [redPacketId, attestation, { value: claimFee }]
        if ([97, 56].includes(this.chainId)) {
          const gasPrice = await this.formatProvider.getGasPrice();
          params[2].gasPrice = gasPrice
        }
        const txreceipt = await this.fundContract.sendTransaction('reClaim', params)

        return resolve(txreceipt)
      } catch (error) {
        // console.log('claimBySource', error)
        return reject(error)
      }
    });
  }

}

export { FundForRedPacket };
