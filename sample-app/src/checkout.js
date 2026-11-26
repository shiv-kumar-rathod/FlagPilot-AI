function checkout(flags) {
  if (flags.isEnabled("checkout_v2")) {
    return "New checkout";
  }

  return "Legacy checkout";
}

module.exports = { checkout };