import crypto from "crypto";

export function verifyGitHubSignature(
  payload: string,
  signature: string
) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Missing GitHub webhook secret");
  }

  const hmac = crypto.createHmac(
    "sha256",
    secret
  );

  const digest =
    "sha256=" +
    hmac
      .update(payload)
      .digest("hex");

  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    digestBuffer,
    signatureBuffer
  );
}