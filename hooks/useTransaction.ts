import { useCallback, useEffect, useState } from "react";

import useWalletConnect from "@/hooks/useWalletConnect";
import {
  Coin,
  TFee,
  TLog,
  TLogEvent,
  TMessage,
  TOption,
  TSignerInfos,
} from "@/types";
import * as instance from "@/utils/api";

const LIMIT = 20;

export interface ITransaction {
  code: number;
  codespace: string;
  data: string;
  events: TLogEvent[];
  gas_used: string;
  gas_wanted: string;
  height: string;
  info: string;
  logs: TLog;
  raw_log: string;
  timestamp: string;
  tx: {
    "@type": string;
    body: {
      messages: TMessage[];
      memo: string;
      timeout_height: string;
      extension_options: TOption[];
      non_critical_extension_options: TOption[];
    };
    auth_info: {
      signer_infos: TSignerInfos[];
      fee: TFee;
      tip: {
        amount: Coin[];
        tipper: string;
      };
    };
    signatures: string;
  };
  txhash: string;
}

const useTransaction = () => {
  const { address } = useWalletConnect();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const fetchTransactions = useCallback(async (offset = 0) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await instance.get(
        `/cosmos/tx/v1beta1/txs?query=message.sender=%27${address}%27&pagination.limit=${LIMIT}&pagination.offset=${offset}&order_by=ORDER_BY_DESC`
      );
      setTotalTransactions(Math.ceil(Number(data.total) / LIMIT));
      setTransactions(data.tx_responses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, fetchTransactions]);

  const handlePageClick = ({ selected }: { selected: number }) => {
    const offset = selected * LIMIT;
    fetchTransactions(offset);
  };

  return {
    isLoading,
    error,
    transactions,
    totalTransactions,
    handlePageClick,
  };
};

export default useTransaction;
