export function formatInr(value: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function balanceActionLabel(operation: "ADD" | "REMOVE" | "SET" | "ALLOTMENT"): string {
  if (operation === "ADD") return "+ Add Money";
  if (operation === "REMOVE") return "- Remove Money";
  if (operation === "ALLOTMENT") return "Allotment cost";
  return "Set Balance";
}
