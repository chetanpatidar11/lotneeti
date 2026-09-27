export function formatInr(value: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function balanceActionLabel(operation: "ADD" | "REMOVE" | "SET"): string {
  if (operation === "ADD") return "+ Add Money";
  if (operation === "REMOVE") return "- Remove Money";
  return "Set Balance";
}
