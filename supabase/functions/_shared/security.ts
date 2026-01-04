const parseAllowedOrigins = () => {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

export const getAllowedOrigin = (req: Request) => {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return allowedOrigins.includes(origin) ? origin : null;
};

export const getClientIp = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip");
  return realIp?.trim() || "unknown";
};
