import {ethers} from 'ethers';
import {PrimusZKTLS} from "@primuslabs/zktls-js-sdk";
import {appSign} from '../api'
import {CONTRACTADDRESS, TEST_APP_ID} from "../config/constants";
import {Attestation, TipRecipientInfo, TipToken} from '../index.d'
import Contract from './Contract';
import abiJson from '../config/abi.json'

class Tip {
    private _attestLoading: boolean;
    private zkTlsSdk!: PrimusZKTLS;
    private tipContract!: ethers.Contract;

    constructor() {
        this._attestLoading = false
    }

    async init(provider: any, appId: string, appSecret?: string) {
        console.log(`Init client with appId:${appId} appSecret:${appSecret}`)
        this.tipContract = new Contract(provider, CONTRACTADDRESS, abiJson).contractInstance;
        if(!this.tipContract){
            throw new Error('Init contract failed!')
        }
        this.zkTlsSdk = new PrimusZKTLS();
        await this.zkTlsSdk.init(
            TEST_APP_ID
        );
    }

    async tip(tipToken: TipToken, tipRecipientInfo: TipRecipientInfo) {
        try {
            await this.tipContract.call('tip', [tipToken, tipRecipientInfo], {value: tipRecipientInfo.amount})
        } catch (e) {
            console.log(e)
        }
    }

    async tipBatch(tipToken: TipToken, tipRecipientInfoList: TipRecipientInfo[]) {
        try {
            await this.tipContract.call('tipBatch', [tipToken, tipRecipientInfoList])
        } catch (e) {
            console.log(e)
        }
    }

    async attest(templateId: string, attConditions: any[]): Promise<Attestation | undefined> {
        if (!this.zkTlsSdk?.padoExtensionVersion) {
            return;
        }
        if (this._attestLoading) {
            return;
        }

        this._attestLoading = true

        const attRequest = await this.zkTlsSdk.generateRequestParams(
            templateId
        );
        if (attConditions) {
            attRequest.setAttConditions(attConditions);
        }
        const signParams = attRequest.toJsonString();
        console.log("signParams", signParams);
        let appSignRc, appSignResult;
        try {
            const {rc, result} = await appSign(signParams);
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
                const att = await this.zkTlsSdk.startAttestation(
                    JSON.stringify(formatAttestParams)
                );
                console.log("attestation", att);
                return att;
            }
            return;
        } catch (error: any) {
            console.log(error);
            if (error.code) {

            }
        } finally {
            this._attestLoading = false
        }
        return;
    }

    async claimBySource(idSource: string, attestation: Attestation) {
        try {
            await this.tipContract.call('claimBySource', [idSource, attestation])
        } catch (e) {
        }
    }

    async claimByMultiSource(idSourceList: string[], attestationList: Attestation[]) {
        try {
            await this.tipContract.call('claimByMultiSource', [idSourceList, attestationList])
        } catch (e) {
            console.log(e)
        }
    }
}

export {Tip};
