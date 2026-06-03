<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorPoliciesList
    family="third_party"
    variance="Motor Protect Extra (Private Bus)"
    category="Motor · MPE Private Bus"
    subtitle="All your Motor Protect Extra (Private Bus) policies, ordered by most recent."
    buy-href="/motor/mpe-private-bus/buy"
  />
</template>
