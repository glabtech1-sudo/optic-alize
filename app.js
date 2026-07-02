// app.js
// Entry point for Phusion Passenger and Node.js hosting environments (like Hostinger or cPanel)
// This file dynamically imports the compiled CommonJS server bundle from the build directory.

import("./dist/server.cjs").catch(err => {
  console.error("❌ Failed to start the server from dist/server.cjs:", err);
  process.exit(1);
});
