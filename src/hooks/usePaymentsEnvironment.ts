import { useEffect, useState } from "react";
import { getPaymentsEnvironment } from "@/utils/payments.functions";

type StripeEnv = "sandbox" | "live";

let cached: StripeEnv | null = null;

export function usePaymentsEnvironment() {
  const [environment, setEnvironment] = useState<StripeEnv | null>(cached);

  useEffect(() => {
    if (cached) return;
    let active = true;
    getPaymentsEnvironment()
      .then((result) => {
        cached = result.environment;
        if (active) setEnvironment(result.environment);
      })
      .catch(() => {
        if (active) setEnvironment("sandbox");
      });
    return () => {
      active = false;
    };
  }, []);

  return environment;
}
