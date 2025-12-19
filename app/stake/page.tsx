"use client";

import Stake from "@/components/pages/stake/Stake";
import useAccountInfo from "@/hooks/useAccountInfo";
import useDelegate from "@/hooks/useDelegate";
import useRedelegate from "@/hooks/useRedelegate";
import useStaking from "@/hooks/useStaking";
import useUnbond from "@/hooks/useUnbond";
import useWalletConnect from "@/hooks/useWalletConnect";
import { useMemo } from "react";
import { DENOM } from "@/constant/network";

const StakePage = () => {
  const { address } = useWalletConnect();
  const {
    accountInfo,
    loading,
    fetchData: refreshAccount,
  } = useAccountInfo();
  const staking = useStaking(address);

  const availableBalance = useMemo(() => {
    if (!accountInfo) return 0;
    const lume = accountInfo.balances.find((b) => b.denom === DENOM);
    return lume ? Number(lume.amount) : 0;
  }, [accountInfo]);

  const refreshAll = () => {
    refreshAccount();
    staking.fetchUnbondingDelegations();
  };

  const delegate = useDelegate({
    customMemo: "Stake",
    availableAmount: `${availableBalance}`,
    callback: refreshAll,
  });
  const unbond = useUnbond({
    customMemo: "Unbond",
    callback: refreshAll,
  });
  const redelegate = useRedelegate({
    customMemo: "Redelegate",
    callback: refreshAll,
  });

  return (
    <Stake
      accountInfo={accountInfo}
      loadingAccount={loading}
      staking={staking}
      delegate={delegate}
      unbond={unbond}
      redelegate={redelegate}
    />
  );
};

export default StakePage;
