import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RouteOption } from "@orderly.network/types";

export function useNav() {
  const navigate = useNavigate();

  const onRouteChange = useCallback(
    (option: RouteOption) => {
      if (option.target === "_blank") {
        window.open(option.href);
        return;
      }

      navigate(option.href === "/" ? "/swap" : option.href);
    },
    [navigate],
  );

  return { onRouteChange };
}
