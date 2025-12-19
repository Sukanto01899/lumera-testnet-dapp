"use client";

import Wallet from "@/components/pages/wallet/Wallet";
import useAccountInfo from "@/hooks/useAccountInfo";
import useDelegate from "@/hooks/useDelegate";
import useSend from "@/hooks/useSend";
import useTransaction from "@/hooks/useTransaction";
import useWalletConnect from "@/hooks/useWalletConnect";

export default function WalletPage() {
  const { address } = useWalletConnect();
  const {
    accountInfo,
    loading,
    fetchData: refreshAccount,
  } = useAccountInfo();
  const send = useSend({ callback: refreshAccount, customMemo: "Wallet send" });
  const delegate = useDelegate({
    callback: refreshAccount,
    customMemo: "Delegate from wallet",
  });
  const { transactions, isLoading: loadingTransactions } = useTransaction();

  return (
    <Wallet
      address={address}
      accountInfo={accountInfo}
      loadingAccount={loading}
      transactions={transactions}
      loadingTransactions={loadingTransactions}
      send={send}
      delegate={delegate}
    />
  );
}
