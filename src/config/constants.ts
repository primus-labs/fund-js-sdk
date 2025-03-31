/**
 * chainId=> contractAddress
 */
export const Fund_CONTRACTS: { [chainId: number]: string } = {
    // monad testnet
    10143: "0xcd1Ed9C1595A7e9DADe76808dd5e66aA95940A92",
};
export const SUPPORTEDCHAINIDS:number[] = Object.keys(Fund_CONTRACTS).map(i => Number(i))

export const DATASOURCETEMPLATEMAP:{[propName:string]: string} = {
    x: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
    tiktok: "2b22c9f8-686d-4482-a0cf-c9c43c1181ad",
    'google account': ''
};
export const SUPPORTEDSOCIALPLATFORMS: string[] = Object.keys(DATASOURCETEMPLATEMAP)
export const NATIVETOKENS: Record<number, string> = {
  1: "ETH",      // Ethereum Mainnet
  10143: "MON",  // monad testnet
};