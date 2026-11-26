function payment(flags) {
  if (flags.isEnabled("payment_retry")) {
    return "Retry payment";
  }

  return "Do not retry";
}

module.exports = { payment };