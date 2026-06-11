import crypto from "crypto";

export function generateReadableToken(prefix = "QUIZ") {
  const random = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `${prefix}-${random}`;
}