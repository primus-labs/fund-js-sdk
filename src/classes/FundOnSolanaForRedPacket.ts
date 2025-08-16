import * as anchor from "@coral-xyz/anchor";
import { Attestation, TokenInfo, SendOnSolanaForRedPacketParam, RedPacketId } from '../index.d'
import { getProgram, toTokenAmount, getTokenDecimals, formatAttestation, hexToUint8Array, decodeReSendEvent, decodeClaimEvent } from './solana/program';
import redPacketIdl from '../config/redPacketIdl.json'
import zktlsIdl from '../config/zktlsIdl.json'
import { reSend, getREInfo, reClaim, reSenderWithdraw } from './solana/sdk'
import { PublicKey } from "@solana/web3.js";


class FundOnSolanaForRedPacket {
  private fundContract!: any;
  private provider!: any;
  constructor() {
  }
  async init(provider: any, chainId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        this.fundContract = getProgram(redPacketIdl, provider);

        this.provider = provider;
        resolve('success');
      } catch (error) {
        return reject(error);
      }
    });
  }

  async fund(tokenInfo: TokenInfo, sendParam: SendOnSolanaForRedPacketParam) {
    return new Promise(async (resolve, reject) => {
      try {
        let decimals = 9
        let amountOnChain
        let formatTokenInfo: any = { ...tokenInfo }
        if (tokenInfo.tokenType === 1) {
          formatTokenInfo.tokenAddress = anchor.web3.PublicKey.default
          // amountOnChain = new BN(sendParam.amount).mul(new BN(LAMPORTS_PER_SOL))
          amountOnChain = toTokenAmount(sendParam.amount, decimals)
        } else if (tokenInfo.tokenType === 0) {
          decimals = await getTokenDecimals(tokenInfo.tokenAddress, this.provider.connection)
          amountOnChain = toTokenAmount(sendParam.amount, decimals)
          formatTokenInfo.tokenAddress = new PublicKey(tokenInfo.tokenAddress)
        }

        const reSendParam = {
          ...sendParam,
          amount: amountOnChain,
          checkContract: sendParam.checkContract || anchor.web3.PublicKey.default,
        }

        const result = await reSend({
          redEnvelopeProgram: this.fundContract,
          userKey: this.provider.publicKey,
          provider: this.provider,
          tipToken: formatTokenInfo,
          reSendParam
        });
        resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async claim(redPacketId: RedPacketId, attestation: Attestation) {
    return new Promise(async (resolve, reject) => {
      try {
        const zktlsProgram = getProgram(zktlsIdl, this.provider);
        const attObj = formatAttestation(attestation)
        let formatReId = hexToUint8Array(redPacketId);
        const result = await reClaim({
          redEnvelopeProgram: this.fundContract, userKey: this.provider.publicKey, provider: this.provider, zktlsProgram: zktlsProgram
          , reId: formatReId, attObj
        });
        return resolve(result)
      } catch (error) {
        return reject(error)
      }
    });
  }

  async withdraw(redPacketId: RedPacketId) {
    return new Promise(async (resolve, reject) => {
      try {
        let formatReId = hexToUint8Array(redPacketId);
        const result = await reSenderWithdraw({
          redEnvelopeProgram: this.fundContract,
          userKey: this.provider.publicKey,
          provider: this.provider,
          reId: formatReId,
        });
        return resolve(result)
      } catch (error) {
        return reject(error)
      }
    });
  }


  async getRedPacketInfo(redPacketId: RedPacketId) {
    return new Promise(async (resolve, reject) => {
      try {
        let formatReId = hexToUint8Array(redPacketId);
        const result = await getREInfo({ redEnvelopeProgram: this.fundContract, reId: formatReId });
        const redpacketInfo = { ...result, id: redPacketId }
        return resolve(redpacketInfo)
      } catch (error) {
        // console.log('getREInfo', error)
        return reject(error)
      }
    });
  }

  async decodeReSendEvent(eventData: string) {
    return await decodeReSendEvent(eventData)
  }
  async decodeClaimEvent(eventData: string) {
    return await decodeClaimEvent(eventData)
  }


}

export { FundOnSolanaForRedPacket };
