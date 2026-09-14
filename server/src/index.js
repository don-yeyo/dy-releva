import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Don Yeyo Precios Backend corriendo en:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   API Health: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
