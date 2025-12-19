import numeral from "numeral";

import { IValidator } from "@/types";

export const getMessages = (
  msgs: { "@type"?: string; typeUrl?: string }[] = []
) => {
  if (!msgs.length) return "";

  const grouped = msgs
    .map((msg) => {
      const msgType = msg["@type"] || msg.typeUrl || "unknown";
      return msgType.substring(msgType.lastIndexOf(".") + 1).replace("Msg", "");
    })
    .reduce<Record<string, number>>((acc, current) => {
      acc[current] = (acc[current] ?? 0) + 1;
      return acc;
    }, {});

  return Object.keys(grouped)
    .map((key) => (grouped[key] > 1 ? `${key}A-${grouped[key]}` : key))
    .join(", ");
};

export const calculateTotalPower = (validators: IValidator[]) => {
  return validators.reduce(
    (sum, validator) => sum + parseInt(validator.delegator_shares, 10),
    0
  );
};

export const calculatePercent = (
  input?: string | number,
  total?: string | number
) => {
  if (!input || !total) return "0";
  const percent = Number(input) / Number(total);
  return numeral(percent > 0.0001 ? percent : 0).format("0.[00]%");
};

export const isNumber = (value: number) =>
  typeof value === "number" && Number.isFinite(value);
