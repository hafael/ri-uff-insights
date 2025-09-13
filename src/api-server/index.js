const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Servidor API funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor API ouvindo na porta ${port}`);
});