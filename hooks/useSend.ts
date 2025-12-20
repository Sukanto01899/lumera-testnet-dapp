import { useEffect, useState } from "react";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

import { FEE_RATIO, FEE_VALUE, GAS_LIMIT, GAS_RATIO, RATE_VALUE } from "@/constant";
import { DENOM } from "@/constant/network";
import useWalletConnect from "@/hooks/useWalletConnect";
import { Coin } from "@/hooks/useAccountInfo";

interface UseDepositOptions {
  callback?: () => void;
  customMemo?: string;
}

const useSend = (options: UseDepositOptions = {}) => {
  const { address, getClient, isConnected } = useWalletConnect();
  const [isLoading, setLoading] = useState(false);
  const [optionsAdvanced, setOptionsAdvanced] = useState({
    senderAddress: address,
    fees: FEE_VALUE,
    gas: GAS_LIMIT,
    memo: "",
    amount: "",
    recipient: "",
    balances: "",
  });
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [balances, setBalances] = useState<Coin[]>([]);
  const [selectedDenom, setSelectedDenom] = useState<string>("ulume");
  const [transactionHash, setTransactionHash] = useState("");

  useEffect(() => {
    if (isConnected) {
      queryBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    if (options?.customMemo) {
      setOptionsAdvanced({
        ...optionsAdvanced,
        memo: options?.customMemo,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.customMemo]);

  useEffect(() => {
    setOptionsAdvanced((prev) => ({
      ...prev,
      senderAddress: address,
    }));
  }, [address]);

  const resetData = () => {
    setShowAdvanced(false);
    setLoading(false);
    setOptionsAdvanced({
      senderAddress: address,
      fees: FEE_VALUE,
      gas: GAS_LIMIT,
      memo: options?.customMemo || "",
      amount: "",
      recipient: "",
      balances: "",
    });
  };

  const handleInputChange = (name: string, value: string) => {
    setOptionsAdvanced({
      ...optionsAdvanced,
      [name]: value,
    });
  };

  const handleShowAdvancedChange = (status: boolean) => {
    setShowAdvanced(status);
  };

  const handleSendClick = async () => {
    setError("");
    if (!optionsAdvanced.amount) {
      setError("Please enter amount.");
      return;
    }
    if (!optionsAdvanced.recipient) {
      setError("Please enter recipient.");
      return;
    }
    if (!optionsAdvanced.senderAddress) {
      setError("Please connect wallet.");
      return;
    }
    setLoading(true);
    try {
      const client = await getClient();
      const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.fromPartial({
          fromAddress: address,
          toAddress: optionsAdvanced.recipient,
          amount: [
            {
              denom: DENOM,
              amount: `${Number(optionsAdvanced.amount) * RATE_VALUE}`,
            },
          ],
        }),
      };
      let gasLimit = optionsAdvanced.gas;
      if (optionsAdvanced.gas === GAS_LIMIT) {
        const gasEstimate = await client.simulate(
          optionsAdvanced.senderAddress,
          [msg],
          optionsAdvanced.memo
        );
        gasLimit = `${Math.ceil(gasEstimate * GAS_RATIO)}`;
      }
      let estimatedFee = optionsAdvanced.fees;
      if (optionsAdvanced.fees === FEE_VALUE) {
        estimatedFee = `${Math.ceil(Number(gasLimit) * FEE_RATIO)}`;
      }
      const fee = {
        amount: [{ denom: DENOM, amount: estimatedFee }],
        gas: gasLimit,
      };
      const result = await client.signAndBroadcast(
        optionsAdvanced.senderAddress,
        [msg],
        fee,
        optionsAdvanced.memo
      );
      if (result?.transactionHash) {
        setTransactionHash(result?.transactionHash);
        resetData();
        if (options?.callback) {
          options.callback();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
    setLoading(false);
  };

  const queryBalances = async (): Promise<void> => {
    try {
      const client = await getClient();
      if (!client) {
        return;
      }
      const allBalances = await client.getAllBalances(address);
      setBalances(allBalances.filter((b) => parseInt(b.amount, 10) > 0));
      if (allBalances.length > 0) {
        setSelectedDenom(allBalances[0].denom);
        setOptionsAdvanced((prev) => ({
          ...prev,
          balances: allBalances[0].amount,
          senderAddress: address,
        }));
      }
    } catch {
      // noop
    }
  };

  const handleCloseCongratulationsModal = () => {
    setTransactionHash("");
    resetData();
  };

  return {
    error,
    showAdvanced,
    isLoading,
    optionsAdvanced,
    balances,
    selectedDenom,
    transactionHash,
    handleInputChange,
    handleShowAdvancedChange,
    handleSendClick,
    handleCloseCongratulationsModal,
  };
};

export default useSend;
