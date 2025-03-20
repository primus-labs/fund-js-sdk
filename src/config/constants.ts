/**
 * chainId=> contractAddress
 */
export const Fund_CONTRACTS: { [chainId: number]: string } = {
    // monad testnet
    10143: "0xcd1Ed9C1595A7e9DADe76808dd5e66aA95940A92",// 0x8F796FbE77E0c7afb695d3F7B5283989299069b9
};
export const SUPPORTEDCHAINIDS:number[] = Object.keys(Fund_CONTRACTS).map(i => Number(i))

export const DATASOURCETEMPLATEMAP:{[propName:string]: string} = {
    x: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
    tiktok: "c8fca32d-b6cc-46c9-80f6-6332ed54916e"
};
export const SUPPORTEDSOCIALPLATFORMS: string[] = Object.keys(DATASOURCETEMPLATEMAP)