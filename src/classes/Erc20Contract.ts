import { ethers } from 'ethers';
import Contract from './Contract';
import abi from '../config/erc20Abi.json';
import { ApproveParams } from '../index.d';

const { parseUnits, formatUnits } = ethers.utils;

class Erc20Contract {
  private provider!: any;
  contractInstance: any;
  constructor(provider: any, address: string) {
    if (!provider || !address ) {
        throw new Error('provider, address are required');
    }
    this.provider = provider;
    this.contractInstance = new ethers.Contract(address, abi, provider);
  }
  async decimals() {
    const res = await this.contractInstance.decimals()
    return res
  }
  async symbol() {
    const res = await this.contractInstance.symbol()
    return res
  }
  async allowance(userAddress: string, spenderAddress: string) {
    const res = await this.contractInstance.allowance(userAddress, spenderAddress)
    return res
  }
  async getAddress() {
    // const web3Provider = new ethers.providers.Web3Provider(this.provider)
    // const signer = web3Provider.getSigner();
    const address = await this.provider.getAddress();
    return address
  }
  async approve(approveParams:ApproveParams) {
    const { spenderAddress, approveAmount, otherParams } = approveParams
    return new Promise(async (resolve, reject) => {
      try {
        const userAddress = await this.getAddress()
        debugger
        const allowance = await this.allowance(userAddress, spenderAddress);
        const decimals = await this.decimals()
        debugger
        const formatApproveAmount = parseUnits(approveAmount.toString(), decimals)
        const formatAllowance = formatUnits(allowance.toString(), decimals)
        console.log('allowance:', formatAllowance)
        if (allowance.lt(formatApproveAmount)) {    
          let params = [spenderAddress, formatApproveAmount]
          if (otherParams) {
            params.push(otherParams)
          }
          const tx = await this.contractInstance.approve(...params);
          // Wait for the transaction to be mined
          await tx.wait();
          console.log(`Approved: ${approveAmount.toString()}`);
        } else {
            console.log(`Already approved`);
        }
        resolve('Approved');
      } catch (error: any) {
        console.error('Approval failed:', error);
        return reject(error);
      }
    })
  }
}

export default Erc20Contract;