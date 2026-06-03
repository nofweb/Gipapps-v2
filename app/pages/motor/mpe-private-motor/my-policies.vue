<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorPoliciesList
    family="third_party"
    variance="Motor Protect Extra (Private Car)"
    category="Motor · MPE Private Motor"
    subtitle="All your Motor Protect Extra (Private Motor) policies, ordered by most recent."
    buy-href="/motor/mpe-private-motor/buy"
  />
</template>
