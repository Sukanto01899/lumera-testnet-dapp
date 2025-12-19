import { Card } from "@/components/retroui/Card";
import {
  Tabs,
  TabsContent,
  TabsPanels,
  TabsTrigger,
  TabsTriggerList,
} from "@/components/retroui/Tab";
import React from "react";

const Validators = () => {
  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>All Validators</Card.Title>
        <Card.Description>
          Delegate your stake to a validator to earn rewards.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <Tabs>
          <TabsTriggerList>
            <TabsTrigger>Active (0)</TabsTrigger>
            <TabsTrigger>Inactive (0)</TabsTrigger>
          </TabsTriggerList>
          <TabsPanels>
            <TabsContent className="space-y-4"></TabsContent>
            <TabsContent>This is the about section!</TabsContent>
          </TabsPanels>
        </Tabs>
      </Card.Content>
    </Card>
  );
};

export default Validators;
