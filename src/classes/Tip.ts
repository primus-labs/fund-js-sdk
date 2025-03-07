import {ethers} from 'ethers';
import {PrimusZKTLS} from "@primuslabs/zktls-js-sdk";
import {TIP_CONTRACTS} from "../config/constants";
import {Attestation, TipRecipientInfo, TipToken} from '../index.d'
import Contract from './Contract';
import abiJson from '../config/abi.json'
import erc20Abi from '../config/erc20Abi.json'

class Tip {
    private _attestLoading: boolean;
    private zkTlsSdk!: PrimusZKTLS;
    private tipContract!: ethers.Contract;
    private provider!: ethers.providers.Web3Provider;

    constructor() {
        this._attestLoading = false
    }

    getZkTlsSdk(): PrimusZKTLS {
        return this.zkTlsSdk;
    }

    async init(provider: any, appId: string) {
        console.log(`Init client with appId:${appId}`)
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        const tipContractAddress = TIP_CONTRACTS[chainId];
        if (!tipContractAddress) {
            throw new Error(`Unsupported chainId:${chainId}`);
        }
        this.tipContract = new Contract(provider.getSigner(), tipContractAddress, abiJson).contractInstance;
        if (!this.tipContract) {
            throw new Error('Init contract failed!')
        }
        this.provider = provider;
        this.zkTlsSdk = new PrimusZKTLS();
        await this.zkTlsSdk.init(
            appId
        );
    }

    async tip(tipToken: TipToken, tipRecipientInfo: TipRecipientInfo) {
        try {
            const tipRecipientInfos = [];
            tipRecipientInfos[0] = tipRecipientInfo;
            await this.approve(tipToken, tipRecipientInfos)
            await this.tipContract.tip(tipToken, tipRecipientInfo, {value: tipRecipientInfo.amount})
        } catch (e) {
            console.log(e)
        }
    }

    async tipBatch(tipToken: TipToken, tipRecipientInfoList: TipRecipientInfo[]) {
        try {
            await this.approve(tipToken, tipRecipientInfoList)
            await this.tipContract.call('tipBatch', [tipToken, tipRecipientInfoList])
        } catch (e) {
            console.log(e)
        }
    }

    private async approve(tipToken: TipToken, tipRecipientInfoList: TipRecipientInfo[]) {
        try {
            const signer = this.provider.getSigner();
            const address = await signer.getAddress();
            const erc20Contract = new ethers.Contract(tipToken.tokenAddress, erc20Abi, signer);

            const allowance = await erc20Contract.allowance(address, this.tipContract.address);
            const decimals = await erc20Contract.decimals();

            // Compute total amount
            const totalAmount: bigint = tipRecipientInfoList.reduce((acc, cur) => acc + BigInt(cur.amount), 0n);
            const requiredAllowance = totalAmount * (10n ** BigInt(decimals));

            if (allowance < requiredAllowance) {
                const tx = await erc20Contract.approve(this.tipContract.address, requiredAllowance);
                // Wait for the transaction to be mined
                await tx.wait();
                console.log(`Approved: ${requiredAllowance.toString()}`);
                return;
            }
            console.log(`Already approved: ${allowance.toString()}`);
        } catch (e) {
            console.error('Approval failed:', e);
            throw e;
        }
    }


    async attest(templateId: string, attConditions: any[], genAppSignature: (signParams: string) => Promise<string>): Promise<Attestation | undefined> {
        if (!this.zkTlsSdk?.padoExtensionVersion) {
            return;
        }
        if (this._attestLoading) {
            return;
        }

        this._attestLoading = true

        const attRequest = this.zkTlsSdk.generateRequestParams(
            templateId
        );
        if (attConditions) {
            attRequest.setAttConditions(attConditions);
        }
        const signParams = attRequest.toJsonString();
        const signature = await genAppSignature(signParams);
        if (!signature) {
            throw new Error('appSignature is empty!')
        }
        try {
            const formatAttestParams = {
                attRequest: {
                    ...JSON.parse(signParams),
                },
                appSignature: signature,
            };
            const att = await this.zkTlsSdk.startAttestation(
                JSON.stringify(formatAttestParams)
            );
            console.log("attestation", att);
            return att;
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
