import { ethers } from 'ethers';
import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";
import { Fund_CONTRACTS, DATASOURCETEMPLATESMAP, NATIVETOKENS, CHAINNAMES } from "../config/constants";
import { Attestation, RecipientInfo, TokenInfo ,RecipientBaseInfo, AttestParams } from '../index.d'
import Contract from './Contract';
import abiJson from '../config/abi.json';
import erc20Abi from '../config/erc20Abi.json';


const { parseUnits, formatUnits } = ethers.utils;
class Fund {
    private _attestLoading: boolean;
    private zkTlsSdk!: PrimusZKTLS;
    private fundContract!: any;
    private provider!: ethers.providers.Web3Provider;
    private chainId!: number;
    private _dataSourceTemplateMap = DATASOURCETEMPLATESMAP;
    constructor() {
        this._attestLoading = false
    }

    getZkTlsSdk(): PrimusZKTLS {
        return this.zkTlsSdk;
    }

    async init(provider: any, chainId: number, appId?: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let formatProvider: any;
                if (provider instanceof ethers.providers.JsonRpcProvider) {
                    formatProvider = provider;
                } else {
                    formatProvider = new ethers.providers.Web3Provider(provider)
                }
                const network = await formatProvider.getNetwork();
                const providerChainId = network.chainId;
                console.log('init provider', provider, network)
                if (providerChainId !== chainId) {
                    return reject(`Please connect to the chain with ID ${chainId} first.`)
                }
                const fundContractAddress = Fund_CONTRACTS[chainId];
                if (!fundContractAddress) {
                    return reject(`Unsupported chainId:${chainId}`)
                }
                this.fundContract = new Contract(provider, fundContractAddress, abiJson);
                this.provider = provider;
                this.chainId = chainId;           
                if (appId) {
                    this.zkTlsSdk = new PrimusZKTLS();
                    const extensionVersion = await this.zkTlsSdk.init(
                        appId
                    );
                    resolve(extensionVersion);
                } else {
                    resolve('success');
                } 
            } catch (error) {
                return reject(error);
            }
        });
    }

    async fund(tokenInfo: TokenInfo, recipientInfo: RecipientInfo) {
        return new Promise(async (resolve, reject) => {
            try {
                const recipientInfos = [];
                recipientInfos[0] = recipientInfo;
                let decimals = 18
                let params = []
                
                if (tokenInfo.tokenType === 0) {
                    await this.approve(tokenInfo, recipientInfos)
                    const erc20Contract = new ethers.Contract(tokenInfo.tokenAddress, erc20Abi,  this.provider);
                    decimals = await erc20Contract.decimals();
                }
                
                const tokenAmount = parseUnits(recipientInfo.tokenAmount.toString(), decimals)
                // console.log('classes-Fund-fund',tokenAmount)
                const newFundRecipientInfo = {
                    idSource: recipientInfo.socialPlatform,
                    id: recipientInfo.userIdentifier,
                    amount: tokenAmount,
                    nftIds: []
                }
            
                if (tokenInfo.tokenType === 0) {
                    params = [tokenInfo, newFundRecipientInfo]
                } else {
                    params = [tokenInfo, newFundRecipientInfo, {value: tokenAmount} ]
                }
                const result = await this.fundContract.sendTransaction('tip', params)
                resolve(result);
            } catch (error) {
                return reject(error);
            }
        });
        
        
    }

    async refund(recipients: RecipientBaseInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const newRecipients = recipients.map(i => {
                    return {
                        idSource: i.socialPlatform,
                        id: i.userIdentifier
                    }
                })
                const result = await this.fundContract.sendTransaction('tipperWithdraw', [newRecipients])
                return resolve(result);
            } catch (error) {
                return reject(error);
            }
        });
    }

    async fundBatch(tokenInfo: TokenInfo, recipientInfoList: RecipientInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                let decimals = 18
                let params = []
                if (tokenInfo.tokenType === 0) {
                    await this.approve(tokenInfo, recipientInfoList)
                    const erc20Contract = new ethers.Contract(tokenInfo.tokenAddress, erc20Abi,  this.provider);
                    decimals = await erc20Contract.decimals();
                }
                
                let totalFormatAmount = recipientInfoList.reduce((acc, cur) =>
                                            acc.add(parseUnits(cur.tokenAmount.toString(), decimals)), ethers.BigNumber.from(0))
                const newRecipientInfoList = recipientInfoList.map(i => {
                    const formatAmount = parseUnits(i.tokenAmount.toString(), decimals)
                    return {
                        idSource: i.socialPlatform,
                        id: i.userIdentifier,
                        amount: formatAmount,
                        nftIds: []
                    }
                })
            
                if (tokenInfo.tokenType === 0) {
                    params = [tokenInfo, newRecipientInfoList]
                } else {
                    params = [tokenInfo, newRecipientInfoList, {value: totalFormatAmount} ]
                }

                const result = await this.fundContract.sendTransaction('tipBatch', params)
                return resolve(result);
            } catch (error) {
                return reject(error);
            }
        });
            
    }

    private async approve(tokenInfo: TokenInfo, recipientInfoList: RecipientInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const signer = this.provider.getSigner();
                const address = await signer.getAddress();
                const erc20Contract = new ethers.Contract(tokenInfo.tokenAddress as string, erc20Abi, signer);

                const allowance = await erc20Contract.allowance(address, this.fundContract.address);
                // console.log('allowance', allowance)
                const decimals = await erc20Contract.decimals();

                // Compute total amount
                const requiredAllowance = recipientInfoList.reduce((acc, cur) =>
                                            acc.add(parseUnits(cur.tokenAmount.toString(), decimals)), ethers.BigNumber.from(0))

                if (allowance.lt(requiredAllowance)) {
                    const tx = await erc20Contract.approve(this.fundContract.address, requiredAllowance);
                    // Wait for the transaction to be mined
                    await tx.wait();
                    console.log(`Approved: ${requiredAllowance.toString()}`);
                } else {
                    console.log(`Already approved: ${allowance.toString()}`);
                }
                resolve('Approved');
            } catch (error:any) {
                console.error('Approval failed:', error);
                if (error?.code === 'ACTION_REJECTED') {
                    return reject('user rejected transaction')
                }
                return reject(error);
            }
        });
    }

    async attest(attestParams: AttestParams, genAppSignature: (signParams: string) => Promise<string>): Promise<Attestation | undefined> {
        return new Promise(async (resolve, reject) => {
            if (!this.zkTlsSdk?.padoExtensionVersion) {
                return reject(`Uninitialized!`)
            }
            if (this._attestLoading) {
                return reject(`Under proof!`)
            }
            const { socialPlatform, userIdentifier, address } = attestParams

            this._attestLoading = true
            const {id: templateId, field} = this._dataSourceTemplateMap[socialPlatform]
            const attRequest = this.zkTlsSdk.generateRequestParams(
                templateId,
                address
            );
            attRequest.setAttConditions([
                [
                    {
                        field,
                        op: 'STREQ',
                        value: userIdentifier,
                    },
                ],
            ]);
            
            const signParams = attRequest.toJsonString();
            const signature = await genAppSignature(signParams);
            if (!signature) {
                this._attestLoading = false
                return reject(`appSignature is empty!`)
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
                // console.log("attestation", attestation);
                this._attestLoading = false
                return resolve(attestation)
            } catch (error: any) {
                // console.error('attest error:',error);
                this._attestLoading = false
                return reject(error);
            }
        });
    }

    async claimBySource(socialPlatform: string, userIdentifier: string, attestation: Attestation) {
        return new Promise(async (resolve, reject) => {
            try {
                const claimFee = await this.fundContract.callMethod('claimFee', [])
                // console.log('claimFee', claimFee)]
                const fundRecords = await this.fundContract.callMethod('getTipRecords', [{ idSource: socialPlatform, id: userIdentifier }])
                console.log('fundRecords', fundRecords)
                const recordCount = fundRecords.length
                if (recordCount <= 0) {
                    return reject(`No fund records.`)
                } else {
                    const totalFee = claimFee.mul(recordCount)
                    // console.log('totalFee', totalFee)
                    const txreceipt = await this.fundContract.sendTransaction('claimBySource', [socialPlatform, attestation, { value: totalFee }])
                    return resolve(txreceipt)
                }
            } catch (error) {
                // console.log('claimBySource', error)
                return reject(error)
            }
        });
    }

    async claimByMultiSource(socialPlatforms: string[], userIdentifiers: string[], attestationList: Attestation[]) {
        return new Promise(async (resolve, reject) => {
            try {
                if (socialPlatforms.length !== userIdentifiers.length || socialPlatforms.length !== attestationList.length) {
                  return reject(`socialPlatforms, userIdentifiers, attestationList length must be equal.`)
                }

                const claimFee = await this.fundContract.callMethod('claimFee', [])
                // console.log('claimFee', claimFee)
                
                let allFundRecords = [];
                let recordCount = 0;
                for (const [index, value] of socialPlatforms.entries()) {
                    const fundRecords = await this.fundContract.callMethod('getTipRecords', [{ idSource: value, id: userIdentifiers[index] }])
                    // console.log(`${value}-${userIdentifiers[index]} fundRecords`, fundRecords)
                    allFundRecords.push(...fundRecords)
                    recordCount += fundRecords.length;
                }
                
                if (recordCount <= 0) {
                    return reject(`No fund records.`)
                } else {
                    const totalFee = claimFee.mul(recordCount)
                    // console.log('totalFee', totalFee)
                    const txreceipt = await this.fundContract.sendTransaction('claimByMultiSource', [socialPlatforms, userIdentifiers, attestationList, { value: totalFee }])
                    return resolve(txreceipt)
                }
            } catch (error) {
                console.error('claimByMultiSource', error)
                return reject(error)
            }
        });
    }

    async getTipRecords(getFundRecordsParams:RecipientBaseInfo[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const formatGetFundRecordsParams = getFundRecordsParams.map(item => {
                    return {
                        idSource: item.socialPlatform,
                        id: item.userIdentifier
                    }
                })
                const fundRecords = await this.fundContract.callMethod('getTipRecords', formatGetFundRecordsParams)
                console.log('fundRecords', fundRecords)

                let formatRecords = []
                for (const record of fundRecords) {
                    const { tipper, timestamp, tipToken: [tokenType, tokenAddress], amount } = record
                    let decimals = 18
                    let symbol = ''
                    if (tokenType === 0) {
                        const erc20Contract = new ethers.Contract(tokenAddress, erc20Abi,  this.provider);
                        decimals = await erc20Contract.decimals();
                        symbol = await erc20Contract.symbol();
                    } else if (tokenType === 1) {
                        symbol = NATIVETOKENS[this.chainId]
                    }
                    let fundToken: any = {
                        tokenType,
                        // tokenAmount: formatUnits(amount, decimals),
                        decimals,
                        symbol,
                        chainName: CHAINNAMES[this.chainId]
                    }
                    if (tokenType === 0) {
                        fundToken.tokenAddress = tokenAddress
                    }
                    formatRecords.push({
                        funder: tipper,
                        fundToken,
                        amount: formatUnits(amount, decimals),
                        timestamp: timestamp.toNumber() * 1000
                    })
                }
                console.log('formatRecords', formatRecords)
                return resolve(formatRecords)
            } catch (error) {
                // console.log('getTipRecords', error)
                return reject(error)
            }
        });
    }
 }

export { Fund };
