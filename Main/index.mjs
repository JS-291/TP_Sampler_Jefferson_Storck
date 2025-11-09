import express from "express";

const app = express();
const PUBLIC_DIR="public";

app.use(express.static(PUBLIC_DIR));

app.listen(4000, () => console.log("Server running on http://localhost:4000"));