import bcrypt from "bcrypt";

const plain = "123456";
const hash = "$2b$10$CX4EfPDQbOiLEA6uGtZpmOrzKsBXc4V/8mD40SBd0AMuhIkASOWzm";

const run = async () => {
    const result = await bcrypt.compare(plain, hash);
    console.log("Compare result:", result);
};

run();
