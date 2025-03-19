import { ethers } from 'ethers';
import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";
import { TIP_CONTRACTS } from "../config/constants";
import { Attestation, TipRecipientInfo, TipToken } from '../index.d'
import Contract from './Contract';
import abiJson from '../config/abi.json';
import erc20Abi from '../config/erc20Abi.json';

class Tip {
    private _attestLoading: boolean;
    private zkTlsSdk!: PrimusZKTLS;
    private tipContract!: any;
    private provider!: ethers.providers.Web3Provider;
    constructor() {
        this._attestLoading = false
    }

    getZkTlsSdk(): PrimusZKTLS {
        return this.zkTlsSdk;
    }

    async init(provider: any, appId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`Init client with appId:${appId}`)
                const network = await provider.getNetwork();
                const chainId = network.chainId;
                const tipContractAddress = TIP_CONTRACTS[chainId];
                if (!tipContractAddress) {
                    const error = new Error(`Unsupported chainId:${chainId}`)
                    reject(error)
                }
                this.tipContract = new Contract(provider, tipContractAddress, abiJson);
                console.log("this.tipContract", this.tipContract )
                this.provider = provider;
                this.zkTlsSdk = new PrimusZKTLS();
                const extensionVersion = await this.zkTlsSdk.init(
                    appId
                );
                resolve(extensionVersion);
            } catch (error) {
                reject(error);
            }
        });
    }

    async tip(tipToken: TipToken, tipRecipientInfo: TipRecipientInfo) {
        return new Promise(async (resolve, reject) => {
            try {
                const tipRecipientInfos = [];
                tipRecipientInfos[0] = tipRecipientInfo;
                let decimals = 18
                let params = []
                
                if (tipToken.tokenType === 0) {
                    await this.approve(tipToken, tipRecipientInfos)
                    const erc20Contract = new ethers.Contract(tipToken.tokenAddress, erc20Abi,  this.provider);
                    decimals = await erc20Contract.decimals();
                } 
                
                const tokenAmount = ethers.utils.parseUnits(tipRecipientInfo.amount.toString(), decimals)
                console.log('classes-Tip-tip4',tokenAmount)
                const newTipRecipientInfo = { ...tipRecipientInfo, amount: tokenAmount }
            
                if (tipToken.tokenType === 0) {
                    params = [tipToken, newTipRecipientInfo]
                } else {
                    params = [tipToken, newTipRecipientInfo, {value: tokenAmount} ]
                }
                const result = await this.tipContract.sendTransaction('tip', params)
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        
        
    }

    async tipBatch(tipToken: TipToken, tipRecipientInfoList: TipRecipientInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                let decimals = 18
                let params = []
                if (tipToken.tokenType === 0) {
                    await this.approve(tipToken, tipRecipientInfoList)
                    const erc20Contract = new ethers.Contract(tipToken.tokenAddress, erc20Abi,  this.provider);
                    decimals = await erc20Contract.decimals();
                }
                
                let totalFormatAmount = tipRecipientInfoList.reduce((acc, cur) =>
                                            acc.add(ethers.utils.parseUnits(cur.amount.toString(), decimals)), ethers.BigNumber.from(0))
                const newTipRecipientInfoList = tipRecipientInfoList.map(i => {
                    const formatAmount = ethers.utils.parseUnits(i.amount.toString(), decimals)
                    return {
                        ...i,
                        amount: formatAmount
                    }
                })
            
                if (tipToken.tokenType === 0) {
                    params = [tipToken, newTipRecipientInfoList]
                } else {
                    params = [tipToken, newTipRecipientInfoList, {value: totalFormatAmount} ]
                }

                const result = await this.tipContract.sendTransaction('tipBatch', params)
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
            
    }

    private async approve(tipToken: TipToken, tipRecipientInfoList: TipRecipientInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const signer = this.provider.getSigner();
                const address = await signer.getAddress();
                const erc20Contract = new ethers.Contract(tipToken.tokenAddress, erc20Abi, signer);

                const allowance = await erc20Contract.allowance(address, this.tipContract.address);
                console.log('allowance', allowance)
                const decimals = await erc20Contract.decimals();

                // Compute total amount
                const requiredAllowance = tipRecipientInfoList.reduce((acc, cur) =>
                                            acc.add(ethers.utils.parseUnits(cur.amount.toString(), decimals)), ethers.BigNumber.from(0))

                if (allowance < requiredAllowance) {
                    const tx = await erc20Contract.approve(this.tipContract.address, requiredAllowance);
                    // Wait for the transaction to be mined
                    await tx.wait();
                    console.log(`Approved: ${requiredAllowance.toString()}`);
                    return;
                } else {
                    console.log(`Already approved: ${allowance.toString()}`);
                }
                resolve('Approved');
            } catch (error) {
                console.error('Approval failed:', error);
                reject(error);
            }
        });
    }

    async attest(templateId: string, address: string, genAppSignature: (signParams: string) => Promise<string>): Promise<Attestation | undefined> {
        return new Promise(async (resolve, reject) => {
            if (!this.zkTlsSdk?.padoExtensionVersion) {
                const error = new Error(`Uninitialized!`)
                reject(error)
            }
            if (this._attestLoading) {
                const error = new Error(`Under proof!`)
                reject(error)
            }

            this._attestLoading = true

            const attRequest = this.zkTlsSdk.generateRequestParams(
                templateId,
                address
            );
            
            const signParams = attRequest.toJsonString();
            const signature = await genAppSignature(signParams);
            if (!signature) {
                const error = new Error(`appSignature is empty!`)
                reject(error)
            }
            try {
                const formatAttestParams = {
                    attRequest: {
                        ...JSON.parse(signParams),
                    },
                    appSignature: signature,
                };
                const attestation = await this.zkTlsSdk.startAttestation(
                    JSON.stringify(formatAttestParams)
                );
                console.log("attestation", attestation);
                this._attestLoading = false
                resolve(attestation)
            } catch (error: any) {
                console.error('attest error:',error);
                reject(error);
            }
        });
    }

    async claimBySource(idSource: string, id: string, attestation: Attestation) {
        return new Promise(async (resolve, reject) => {
            try {
                const claimFee = await this.tipContract.callMethod('claimFee', [])
                console.log('claimFee', claimFee)
                const tipRecords = await this.tipContract.callMethod('getTipRecords', [{ idSource, id }])
                console.log('tipRecords', tipRecords)
                const recordCount = tipRecords.length
                if (tipRecords <= 0) {
                    const error = new Error(`No tipping records.`)
                    reject(error)
                } else {
                    const totalFee = claimFee.mul(recordCount)
                    console.log('totalFee', totalFee)
                    const txreceipt = await this.tipContract.sendTransaction('claimBySource', [idSource, attestation, { value: totalFee }])
                    resolve(txreceipt)
                }
            } catch (error) {
                console.error('claimBySource', error)
                reject(error)
            }
        });
    }

    async claimByMultiSource(idSourceList: string[], idList: string[], attestationList: Attestation[]) {
        return new Promise(async (resolve, reject) => {
            try {
                if (idSourceList.length !== idList.length || idSourceList.length !== attestationList.length) {
                  const error = new Error(`idSourceList, idList, attestationList length must be equal.`)
                  reject(error)
                }

                const claimFee = await this.tipContract.callMethod('claimFee', [])
                console.log('claimFee', claimFee)
                
                let allTipRecords = [];
                let recordCount = 0;
                for (const [index, value] of idSourceList.entries()) {
                    const tipRecords = await this.tipContract.callMethod('getTipRecords', [{ idSource: value, id: idList[index] }])
                    console.log(`${value}-${idList[index]} tipRecords`, tipRecords)
                    allTipRecords.push(...tipRecords)
                    recordCount += tipRecords.length;
                }
                
                if (recordCount <= 0) {
                    const error = new Error(`No tipping records.`)
                    reject(error)
                } else {
                    const totalFee = claimFee.mul(recordCount)
                    console.log('totalFee', totalFee)
                    const txreceipt = await this.tipContract.sendTransaction('claimByMultiSource', [idSourceList, idList, attestationList, { value: totalFee }])
                    resolve(txreceipt)
                }
            } catch (error) {
                console.error('claimByMultiSource', error)
                reject(error)
            }
        });
    }
}

export {Tip};
