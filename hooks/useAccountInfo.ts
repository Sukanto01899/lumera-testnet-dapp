import { useCallback, useEffect, useState } from "react";
import { StargateClient } from "@cosmjs/stargate";

import * as instance from "@/utils/api";
import useWalletConnect from "@/hooks/useWalletConnect";
import { DENOM, RPC_ENDPOINT } from "@/constant/network";
import { FEE_RATIO, FEE_VALUE, GAS_LIMIT, GAS_RATIO } from "@/constant";

export interface Coin {
  denom: string;
  amount: string;
}

export interface DelegationResponse {
  delegation: {
    delegator_address: string;
    validator_address: string;
    shares: string;
  };
  balance: Coin;
}

interface ValidatorRewards {
  validator_address: string;
  reward: Coin[];
}

interface IEntries {
  balance: string;
  completion_time: string;
  creation_height: string;
  initial_balance: string;
  unbonding_id: string;
  unbonding_on_hold_ref_count: string;
}

interface ValidatorUnbonding {
  delegator_address: string;
  validator_address: string;
  entries: IEntries[];
}

export interface AccountInfoData {
  balances: Coin[];
  delegations: DelegationResponse[];
  rewards: ValidatorRewards[];
  unbonding: ValidatorUnbonding[];
}

export const getTotalRewards = (accountInfo: AccountInfoData | null) => {
  let total = 0;
  if (accountInfo?.rewards?.length) {
    for (const item of accountInfo?.rewards) {
      for (const reward of item.reward) {
        if (reward.denom === DENOM) {
          total += Number(reward.amount);
        }
      }
    }
  }
  return total;
};

const useAccountInfo = () => {
  const { address, getClient } = useWalletConnect();

  const [accountInfo, setAccountInfo] = useState<AccountInfoData | null>({
    balances: [],
    delegations: [],
    rewards: [],
    unbonding: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isClaimLoading, setClaimLoading] = useState(false);
  const [errorClaim, setErrorClaim] = useState<string | null>(null);
  const [claimInfo, setClaimInfo] = useState({
    senderAddress: address,
    fees: FEE_VALUE,
    gas: GAS_LIMIT,
    memo: "Claim rewards",
    totalRewards: "0",
  });
  const [isClaimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedModal, setSelectedModal] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<DelegationResponse | null>(
    null
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [balanceRes, delegationsRes, rewardsRes, resUnbonding] =
        await Promise.all([
          instance.get(`/cosmos/bank/v1beta1/balances/${address}`),
          instance.get(`/cosmos/staking/v1beta1/delegations/${address}`),
          instance.get(
            `/cosmos/distribution/v1beta1/delegators/${address}/rewards`
          ),
          instance.get(
            `/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`
          ),
        ]);

      let balances = balanceRes.data?.balances ?? [];
      if (!balances.length) {
        // Try signer-based fetch first, then fall back to a read-only RPC client
        try {
          const client = await getClient();
          balances = await client.getAllBalances(address);
        } catch {
          try {
            const readonlyClient = await StargateClient.connect(RPC_ENDPOINT);
            balances = await readonlyClient.getAllBalances(address);
          } catch {
            // ignore; balances stay empty
          }
        }
      }

      const delegations = delegationsRes.data?.delegation_responses ?? [];
      const rewards = rewardsRes.data?.rewards ?? [];
      const unbonding = resUnbonding.data?.unbonding_responses ?? [];

      const _accountInfo = {
        balances,
        delegations,
        rewards,
        unbonding,
      };
      setAccountInfo(_accountInfo);
      setClaimInfo((prev) => ({
        ...prev,
        totalRewards: `${getTotalRewards(_accountInfo)}`,
      }));
    } catch (e) {
      // Fallback: try read-only RPC for balances so UI can still show holdings
      try {
        const readonlyClient = await StargateClient.connect(RPC_ENDPOINT);
        const balances = await readonlyClient.getAllBalances(address);
        const _accountInfo = {
          balances: [...balances],
          delegations: [],
          rewards: [],
          unbonding: [],
        };
        setAccountInfo(_accountInfo);
        setClaimInfo((prev) => ({
          ...prev,
          totalRewards: `${getTotalRewards(_accountInfo)}`,
        }));
      } catch (rpcErr) {
        console.error("API Error:", e);
        console.error("RPC fallback error:", rpcErr);
        setAccountInfo({
          balances: [],
          delegations: [],
          rewards: [],
          unbonding: [],
        });
        if (rpcErr instanceof Error) {
          setError(rpcErr);
        } else if (e instanceof Error) {
          setError(e);
        } else {
          setError(new Error("An unknown error occurred."));
        }
      }
    } finally {
      setLoading(false);
    }
  // getClient is stable per wallet instance; excluding from deps to avoid re-creating fetchData every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (!address) {
      setAccountInfo({
        balances: [],
        delegations: [],
        rewards: [],
        unbonding: [],
      });
      setLoading(false);
      setError(null);
      return;
    } else {
      setClaimInfo((prev) => ({
        ...prev,
        senderAddress: address,
      }));
    }
    fetchData();
  }, [address, fetchData]);

  const handleClaimButtonClick = async () => {
    setErrorClaim(null);
    if (!claimInfo.senderAddress) {
      return;
    }
    setClaimLoading(true);
    try {
      const client = await getClient();
      const msgWithdraw = [];
      if (selectedClaim) {
        msgWithdraw.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: {
            delegatorAddress: selectedClaim.delegation.delegator_address,
            validatorAddress: selectedClaim.delegation.validator_address,
          },
        });
      } else {
        const { data } = await instance.get(
          `/cosmos/staking/v1beta1/delegations/${claimInfo.senderAddress}`
        );
        for (const item of data?.delegation_responses) {
          msgWithdraw.push({
            typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            value: {
              delegatorAddress: item.delegation.delegator_address,
              validatorAddress: item.delegation.validator_address,
            },
          });
        }
      }
      let gasLimit = claimInfo.gas;
      if (claimInfo.gas === GAS_LIMIT) {
        const gasEstimate = await client.simulate(
          claimInfo.senderAddress,
          msgWithdraw,
          claimInfo.memo
        );
        gasLimit = `${Math.ceil(gasEstimate * GAS_RATIO)}`;
      }

      let estimatedFee = claimInfo.fees;
      if (claimInfo.fees === FEE_VALUE) {
        estimatedFee = `${Math.ceil(Number(gasLimit) * FEE_RATIO)}`; // 0.028 ulume/gas
      }
      const fee = {
        amount: [{ denom: DENOM, amount: estimatedFee }],
        gas: gasLimit,
      };
      const result = await client.signAndBroadcast(
        claimInfo.senderAddress,
        msgWithdraw,
        fee,
        claimInfo.memo
      );
      if (result?.transactionHash) {
        setTransactionHash(result.transactionHash);
      }
    } catch (e) {
      // console.error('API Error:', e);
      if (e instanceof Error) {
        setErrorClaim(e.message);
      } else {
        setErrorClaim("An unknown error occurred.");
      }
    } finally {
      setClaimLoading(false);
    }
  };

  const handleClaimChange = (name: string, value: string) => {
    const currentClaimInfo = claimInfo;
    setClaimInfo({
      ...currentClaimInfo,
      [name]: value,
    });
  };

  const handleToggleClaimModal = (status: boolean) => {
    setClaimLoading(false);
    setClaimModalOpen(status);
    setSelectedClaim(null);
    setErrorClaim("");
    fetchData();
    if (!status) {
      setTransactionHash("");
    }
  };

  const handleOpenModal = (modal: string) => {
    setSelectedModal(modal);
    setErrorClaim("");
  };

  const handleCloseModal = () => {
    setSelectedModal("");
    setSelectedClaim(null);
    setErrorClaim("");
    fetchData();
    setTransactionHash("");
  };

  const handleCloseCongratulationsModal = () => {
    setTransactionHash("");
    setClaimModalOpen(false);
    setClaimLoading(false);
    setSelectedClaim(null);
    setErrorClaim("");
    fetchData();
  };

  const handleToggleClaimItemModal = (
    status: boolean,
    item: DelegationResponse
  ) => {
    setClaimLoading(false);
    setClaimModalOpen(status);
    setErrorClaim("");
    if (!status) {
      setSelectedClaim(null);
    } else {
      setSelectedClaim(item);
    }
    if (!status) {
      setTransactionHash("");
    }
    fetchData();
  };

  return {
    accountInfo,
    loading,
    error,
    isClaimLoading,
    errorClaim,
    claimInfo,
    isClaimModalOpen,
    selectedModal,
    transactionHash,
    selectedClaim,
    fetchData,
    handleToggleClaimItemModal,
    handleCloseCongratulationsModal,
    handleClaimButtonClick,
    handleClaimChange,
    handleToggleClaimModal,
    handleOpenModal,
    handleCloseModal,
  };
};

export default useAccountInfo;
