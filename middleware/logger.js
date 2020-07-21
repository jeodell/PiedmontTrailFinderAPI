// Checks if user is logged in
const logger = (req, res, next) => {
  req.loggedIn = true
  console.log(
    `${req.method} request sent to/from ${req.protocol}://${req.get('host')}${
      req.originalUrl
    }`
  )
  next()
}

module.exports = logger
