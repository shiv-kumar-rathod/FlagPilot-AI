function onboarding(flags) {
  if (flags.isEnabled("show_demo_button")) {
    return "Show demo";
  }

  return "Hide demo";
}

module.exports = { onboarding };