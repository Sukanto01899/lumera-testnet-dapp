import { Card } from "@/components/retroui/Card";
import { Skeleton } from "@/components/retroui/Skeleton";
import { Text } from "@/components/retroui/Text";
import { AccountInfoData } from "@/types";
import React from "react";
import { getPortfolioData } from "./Dashboard";
import { DENOM } from "@/constant/network";
import { formatTokenDisplay } from "@/lib/format";

const TotalBalance = ({
  accountInfo,
  loading,
}: {
  accountInfo: AccountInfoData | null;
  loading: boolean;
}) => {
  const { stacked, liquid } = getPortfolioData(accountInfo);
  return (
    <Card className="retro-layer">
      <Card.Header>
        <Card.Title>Total Balance</Card.Title>
      </Card.Header>

      <Card.Content>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        ) : (
          <div className="space-y-1">
            <Text as="h5">
              {formatTokenDisplay({
                amount: `${stacked + liquid}`,
                denom: DENOM,
              })}{" "}
              LUME
            </Text>
            <Text className="text-muted-foreground text-sm">
              Liquid + staked combined
            </Text>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default TotalBalance;
