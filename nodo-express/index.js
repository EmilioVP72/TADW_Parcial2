import express from "express";
import apiRoutes from "./routes/api.js";

const app = express();

app.use(express.json());
app.use("/api", apiRoutes);
app.get('/', (req, res) => res.send('Nodo Express Funcionando'));
app.listen(3000, '0.0.0.0', () => console.log('Express en puerto 3000'));