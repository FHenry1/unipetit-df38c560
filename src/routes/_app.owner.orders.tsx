import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/owner/orders")({
  component: OwnerOrdersRedirect,
});

function OwnerOrdersRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/owner", replace: true });
  }, [navigate]);
  return null;
}
