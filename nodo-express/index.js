const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Nodo Express Funcionando'));
app.listen(3000, '0.0.0.0', () => console.log('Express en puerto 3000'));