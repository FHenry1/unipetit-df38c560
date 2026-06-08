import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const inputSchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1).max(500),
});

export const geocodeSnackbar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify caller owns the snackbar (or is admin) before touching it.
    const { data: snack, error: snackErr } = await supabase
      .from("snackbars")
      .select("id, owner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (snackErr) throw new Error("Lookup failed");
    if (!snack) throw new Error("Snackbar not found");

    if (snack.owner_id !== userId) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Forbidden");
    }

    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmKey) throw new Error("Maps credentials missing");

    const res = await fetch(
      `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gmKey,
        },
      },
    );
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    const json = (await res.json()) as {
      status: string;
      results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };
    const loc = json.results?.[0]?.geometry?.location;
    if (!loc) return { lat: null, lng: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("snackbars")
      .update({ lat: loc.lat, lng: loc.lng })
      .eq("id", data.id);

    return { lat: loc.lat, lng: loc.lng };
  });
