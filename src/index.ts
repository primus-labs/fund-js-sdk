import { ethers } from 'ethers';
import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";
import { appSign } from './api'
import { CONTRACTADDRESS, TEST_APP_ID} from "./config/constants";
import { Attestation, TipRecipientInfo,TipToken  } from './index.d'
import Contract from './classes/Contract';
import abiJson from './config/abi.json'

class Tip {
  private _attestLoading: boolean;
  private zktlssdk: PrimusZKTLS;
  private tipContract: ethers.Contract;
  private padoExtensionVersion: string;

  constructor() {
    this._attestLoading = false
    this.padoExtensionVersion = ''
  }

  init(wallet: ethers.Wallet, appId: string, appSecret?: string): Promise<string | boolean> {
    this.tipContract = new Contract(wallet, CONTRACTADDRESS, abiJson)
    this.zktlssdk = new PrimusZKTLS();
    this._initZktlssdk();
  }
  async _initZktlssdk() {
    const extensionVersionFromSdk = await this.zktlssdk.init(
      TEST_APP_ID
    );
  }
  async tip(tipToken: TipToken, tipRecipientInfo: TipRecipientInfo) {
    try {
      await this.tipContract.call('tip', [tipToken, tipRecipientInfo])
    } catch (e) {
    }
  }

  async tipBatch(tipToken: TipToken, tipRecipientInfoList: TipRecipientInfo[]) { 
    try {
      await this.tipContract.call('tipBatch', [tipToken, tipRecipientInfoList])
    } catch (e) {
    }
  }

  async attest(templateId: string , attConditions: any[]) {
    if (!this.zktlssdk?.padoExtensionVersion) {
      return;
    }
    if (this._attestLoading) {
      return;
    }
   
    this._attestLoading = true

    const attRequest = await this.zktlssdk.generateRequestParams(
      templateId
    );
    if (attConditions) {
      attRequest.setAttConditions(attConditions);
    }
    const signParams = attRequest.toJsonString();
    console.log("signParams", signParams);
    let appSignRc, appSignResult;
    try {
      const { rc, result } = await appSign(signParams);
      appSignRc = rc;
      appSignResult = result;
    } catch (e) {
    //  "AxiosError"
    }
    try {
      if (appSignRc === 0) {
        const formatAttestParams = {
          attRequest: {
            ...JSON.parse(signParams),
          },
          appSignature: appSignResult.appSignature,
        };
        const att = await this.zktlssdk.startAttestation(
          JSON.stringify(formatAttestParams)
        );
        console.log("attestation", att);
      }
    } catch (error: any) {
      console.log(error);
      if (error.code) {
       
      }
    } finally {
      this._attestLoading = false
    }
  }

  async claimBySource(idSource:string, attestation: Attestation) {
    try {
      await this.tipContract.call('claimBySource', [idSource, attestation])
    } catch (e) {
    }
  }

  async claimByMultiSource(idSourceList:string[], attestationList: Attestation[]) {
    try {
      await this.tipContract.call('claimByMultiSource', [idSourceList, attestationList])
    } catch (e) {
    }
  }

  // tipperWithdraw() { }
}

export { Tip };
