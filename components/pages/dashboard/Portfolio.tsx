import { Card } from "@/components/retroui/Card";
import { PieChart } from "@/components/retroui/charts/PieChart";
import { Skeleton } from "@/components/retroui/Skeleton";
import { Text } from "@/components/retroui/Text";
import { DENOM } from "@/constant/network";
import { formatTokenDisplay } from "@/lib/format";
import { AccountInfoData } from "@/types";
import React from "react";
import { getPortfolioData } from "./Dashboard";

const Portfolio = ({
  accountInfo,
  loading,
}: {
  accountInfo: AccountInfoData | null;
  loading: boolean;
}) => {
  const { stacked, liquid } = getPortfolioData(accountInfo);
  const data = [
    { name: "Staked", value: stacked },
    { name: "Liquid", value: liquid },
  ];
  return (
    <Card className="retro-layer">
      <Card.Header>
        <Card.Title>Portfolio Overview</Card.Title>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-8 w-full">
            <PieChart
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
            />

            <div className="space-y-2">
              <div>
                <Text as="h6">Staked</Text>
                <Text as="h5">
                  {formatTokenDisplay(
                    {
                      amount: `${stacked}`,
                      denom: DENOM,
                    },
                    false,
                    "0,0.[000000]"
                  )}{" "}
                  LUME
                </Text>
              </div>
              <div className="">
                <Text as="h6">Liquid</Text>
                <Text as="h5">
                  {formatTokenDisplay(
                    {
                      amount: `${liquid}`,
                      denom: DENOM,
                    },
                    false,
                    "0,0.[000000]"
                  )}{" "}
                  LUME
                </Text>
              </div>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default Portfolio;
