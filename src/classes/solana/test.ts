import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { getPrimusZktlsPda, getPrimusRedEnvelopePda, getPrimusRERecordPda } from "./pda";
import {
  PublicKey,
  VersionedTransactionResponse,
  Connection,
  Commitment,
  SystemProgram,
  Transaction,
  Keypair,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { getMockAttestation, getMockAttestor2, getMockReSendParams, createMintAndAccounts, getFeeRecipientAcc } from "./mock";
import {
  waitForTransactionConfirmation,
  initializePrimusZKTLS, setAttestor,
  removeAttestor, verifyAttestation,
  initializePrimusRedEnvelope,
  reSend,
  reClaim,
  reSenderWithdraw,
  ERC20_TYPE,
  NATIVE_TYPE,
  CHUNK_SIZE,
  getREInfo,
  getClaimed,
  setWithdrawDelay,
} from "./sdk";
export async function testReSend({
  redEnvelopeProgram,
  userKey,
  provider,
  payer = null,
  tokenType = NATIVE_TYPE,
  xFollowing = true,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  payer?: Keypair;
  tokenType?: number;
  xFollowing?: boolean;
}): Promise<Buffer | null> {
  let { tipToken, reSendParam } = getMockReSendParams(xFollowing);
  if (tokenType == ERC20_TYPE) {
    if (!payer) {
      alert("payer is null");
    }
    tipToken.tokenType = ERC20_TYPE;
    const { mint, senderTokenAccount } = await createMintAndAccounts(provider, payer, userKey);
    tipToken.tokenAddress = mint;
  }
  const reId = await reSend({ redEnvelopeProgram, userKey, provider, tipToken, reSendParam, payer });
  console.log("reId:", reId?.toString("hex"));

  // some checks
  {
    const reRecord = await getREInfo({ redEnvelopeProgram, reId });
    console.log("reRecord.remainingNumber:", reRecord.remainingNumber);
  }
  if (tipToken.tokenType == ERC20_TYPE) {
    const fromTokenAccount = await getAssociatedTokenAddress(tipToken.tokenAddress, userKey);
    const fromAccount = await getAccount(provider.connection, fromTokenAccount);
    console.log("fromAccount.amount:", fromAccount.amount);

    const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
    const toTokenAccount = await getAssociatedTokenAddress(tipToken.tokenAddress, reRecordPda, true);
    const toAccount = await getAccount(provider.connection, toTokenAccount);
    console.log("toAccount.amount:", toAccount.amount);
  }

  return reId;
}