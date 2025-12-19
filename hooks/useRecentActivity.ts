import { useEffect, useState } from "react";
import axios from "axios";

import { REST_AI_URL } from "@/constant/network";
import useWalletConnect from "@/hooks/useWalletConnect";
import { IRecentActivity } from "@/types";

const useRecentActivity = () => {
  const { address } = useWalletConnect();
  const [recentActivity, setRecentActivity] = useState<IRecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setRecentActivity([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(
          `${REST_AI_URL}/cosmos/tx/v1beta1/txs?order_by=ORDER_BY_DESC&query=message.sender%3D'${address}'&pagination.limit=5`
        );
        setRecentActivity(data.tx_responses);
      } catch (e) {
        if (e instanceof Error) {
          setError(e);
        } else {
          setError(new Error("An unknown error occurred."));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  return {
    recentActivity,
    loading,
    error,
  };
};

export default useRecentActivity;
