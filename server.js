const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory (lightning fast)
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route using RegExp to avoid path-to-regexp errors in newer Express versions
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 CumBear Frontend running at http://localhost:${PORT}`);
});
