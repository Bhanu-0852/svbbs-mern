import KCWallet from '../models/KCWallet.js'

export async function getOrCreateWallet(userId, session = null) {
  let wallet = await KCWallet.findOne({ userId }).session(session)
  if (!wallet) {
    const created = await KCWallet.create([{ userId, balance: 0 }], { session })
    wallet = created[0]
  }
  return wallet
}
