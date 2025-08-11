import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
// import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";


export const getProgram = (idl: any, anchorProvider: any) => {
  return new Program(idl as unknown as Idl, anchorProvider);
}