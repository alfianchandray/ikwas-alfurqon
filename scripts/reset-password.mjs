const response = await fetch('https://ikwas-alfurqon.alfianchandray.workers.dev/api/reset-temp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'ikwas-reset-2026', password: 'ikwas2026' })
});
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
