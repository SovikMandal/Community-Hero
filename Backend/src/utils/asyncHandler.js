// Wraps async route handlers so thrown/rejected errors are forwarded to
// Express's error-handling middleware instead of crashing the process.
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
