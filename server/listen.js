const PORT = process.env.PORT || 3000;

module.exports = function (httpServer) {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
};
