import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, getAccount, approve } from "@solana/spl-token";
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


export function getMockClaimFee() {
  return 1_000;
}
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
    // if (!payer) {
    //   alert("payer is null");
    // }
    tipToken.tokenType = ERC20_TYPE;
    // TODO
    // const { mint, senderTokenAccount } = await createMintAndAccounts(provider, payer, userKey);
    // tipToken.tokenAddress = mint;
    tipToken.tokenAddress = new PublicKey('4aEvQMXgLVwzJsg5SjDpuQ1mA7wM2qj5jdMezRyRMXT5')

    // // approve
    // const ownerPubkey = provider.publicKey; // 当前用户的钱包
    // const delegate = new PublicKey(delegatePubkeyStr); // 被授权的 delegate（可能是 PDA 或其他钱包）
    // const tokenAccount = new PublicKey(tokenAccountStr);

    // // 构造 approve 指令
    // const tx = new Transaction().add(
    //   approve(
    //     tokenAccount,   // token account (ATA)
    //     delegate,       // delegate
    //     userKey,    // owner (当前用户)
    //     reSendParam.amount          // 授权额度，BigInt
    //   )
    // );

    // // 设置 recent blockhash
    // tx.feePayer = ownerPubkey;
    // tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;


    // // sign the transaction (browser wallet + newAccount)
    // tx.partialSign(spaceAccount);
   
    // const signedTx = await provider.wallet.signTransaction(tx);
    // const serializeSignedTx = signedTx.serialize()
    // const sig = await provider.connection.sendRawTransaction(serializeSignedTx);
    // // approve
  }
  const reId = await reSend({ redEnvelopeProgram, userKey, provider, tipToken, reSendParam, payer });
  console.log("reId:", reId?.toString("hex"));
  debugger
  // some checks
  
  const reRecord = await getREInfo({ redEnvelopeProgram, reId });
  debugger
  console.log("reRecord.remainingNumber:", reRecord.remainingNumber);
  
  if (tipToken.tokenType == ERC20_TYPE) {
    const fromTokenAccount = await getAssociatedTokenAddress(tipToken.tokenAddress, userKey);
    const fromAccount = await getAccount(provider.connection, fromTokenAccount);
    console.log("fromAccount.amount:", fromAccount.amount);

    const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
    const toTokenAccount = await getAssociatedTokenAddress(tipToken.tokenAddress, redEnvelopePda, true);
    const toAccount = await getAccount(provider.connection, toTokenAccount);
    console.log("toAccount.amount:", toAccount.amount);
  }

  return reId;
}


export async function testReClaim({
  redEnvelopeProgram,
  userKey,
  provider,
  zktlsProgram,
  reId,
  xFollowing = true,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  zktlsProgram: any;
  reId: any;
  xFollowing?: boolean;
}) {
  const attObj = getMockAttestation(xFollowing);// TODO
  // TODO!!!
  // const feeRecipient = (await getFeeRecipientAcc(provider.connection)).publicKey; // TODO
  // const feeRecipientAddr = 'oCFmGpPYyMhnPk5sVmykxtkiy9MZArq74ms1SqtgrQm'
  // const feeRecipient =  new PublicKey(feeRecipientAddr)
  // const lamportsa = await provider.connection.getBalance(feeRecipient);
  // console.log('before claim, feeRecipient lamports:', lamportsa);

  await reClaim({ redEnvelopeProgram, userKey, provider, zktlsProgram, reId, attObj });
debugger
  // const lamportsb = await provider.connection.getBalance(feeRecipient);
  // console.log('after claim, feeRecipient lamports:', lamportsb);
  // // TODO
  // console.log('feeRecipient should match', lamportsa + getMockClaimFee(), lamportsb)
  // assert.ok(lamportsa + getMockClaimFee() == lamportsb, "feeRecipient should match");

  // Some checks
  {
    const reRecord = await getREInfo({ redEnvelopeProgram, reId });
    // console.log("reRecord:", reRecord);
    console.log("reRecord.remainingNumber:", reRecord.remainingNumber);
    // TODO is necessary?
    console.log("getClaimed x:", await getClaimed({ redEnvelopeProgram, reId, userid: "x&superMan" }));
    console.log("getClaimed g:", await getClaimed({ redEnvelopeProgram, reId, userid: "google account&abc@gmail.com" }));
  }
}


export async function testReSenderWithdraw({
  redEnvelopeProgram,
  userKey,
  provider,
  reId,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  reId: any;
}) {
  await reSenderWithdraw({ redEnvelopeProgram, reId, userKey, provider });
}