import { useEffect } from "react";

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return null;
}
