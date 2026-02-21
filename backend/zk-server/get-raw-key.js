const { Keypair } = require("@stellar/stellar-sdk");

const kp = Keypair.fromSecret("SDYQGKMJHLKHOWDJ75PEAVTEYUIR2VFJNTXJW3OJQ5FXTOCGXTTTE33A");

console.log("Public Key (G...):", kp.publicKey());
console.log("Raw Public Key (hex):", kp.rawPublicKey().toString("hex"));
