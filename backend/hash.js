import bcrypt from "bcryptjs";

const hash =
  await bcrypt.hash(
    "taxcunpam",
    10
  );

console.log(hash);