import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Text } from "@/components/retroui/Text";
import useStaking from "@/hooks/useStaking";
import React from "react";

const StakeLume = () => {
  const { apr, isAPRLoading } = useStaking();

  return (
    <Card className="grid grid-cols-1 md:grid-cols-2">
      <Card className="border-none">
        <Card.Header>
          <Card.Title>Stake LUME</Card.Title>
          <Card.Description>
            Enter details to estimate staking rewards.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="stake-amount">Amount</Label>
            <Input type="number" id="stake-amount" placeholder="0" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="stake-duration">Duration (days)</Label>
            <Input type="number" id="stake-duration" placeholder="30" />
          </div>
          <Button>Continue To Stake</Button>
        </Card.Content>
      </Card>
      <Card className="border-none">
        <Card.Header>
          <Card.Title>Stake Guidelines</Card.Title>
          <Card.Description>
            Quick tips before staking LUME.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <div className="mb-4">
            <Text className="text-sm text-muted-foreground">Current APR</Text>
            <Text as="h4">
              {isAPRLoading ? "Loading..." : `${apr.toFixed(2)}%`}
            </Text>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Choose a reliable validator with good uptime.</p>
            <p>2. Keep a small balance for gas fees.</p>
            <p>3. Unbonding takes time; plan liquidity.</p>
            <p>4. Rewards and APR can change over time.</p>
          </div>
        </Card.Content>
      </Card>
    </Card>
  );
};

export default StakeLume;
