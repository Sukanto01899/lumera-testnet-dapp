import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import React from "react";

const StakeLume = () => {
  return (
    <Card className="grid grid-cols-1 md:grid-cols-2">
      <Card className="border-none">
        <Card.Header>
          <Card.Title>Stake LUME</Card.Title>
          <Card.Description>
            Estimate your potential rewards based on current network APR 0
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="pokemon">Favorite Pokemon</Label>
            <Input type="pokemon" id="pokemon" placeholder="Charmander" />
          </div>
          <Button>Continue To Stake</Button>
        </Card.Content>
      </Card>
      <Card className="border-none">
        <Card.Header>
          <Card.Title>Estimated Staking Rewards</Card.Title>
          <Card.Description>
            Estimate your potential rewards based on current network APR 0
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <div className="grid w-full max-w-sm items-center gap-1.5"></div>

          <p>
            * All calculations are estimates based on the current APR and are
            subject to change.
          </p>
        </Card.Content>
      </Card>
    </Card>
  );
};

export default StakeLume;
