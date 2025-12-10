import bcrypt from "bcrypt";

async function run() {
  const hash = await bcrypt.hash("AdminPassword123", 10);
  console.log(hash);
}
run();

// $2b$10$pqX8Me8bGHMfOEGM4sSxqepvppId/qxxMxxMkBakpYLcSlOhL1AxG


// INSERT INTO users (email, password_hash, role)
// VALUES ('admin1@lineacollect.com', '$2b$10$pqX8Me8bGHMfOEGM4sSxqepvppId/qxxMxxMkBakpYLcSlOhL1AxG', 'admin');
