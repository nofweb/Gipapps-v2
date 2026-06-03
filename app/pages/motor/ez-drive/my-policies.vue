<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorPoliciesList
    family="comprehensive"
    variance="EZ Drive"
    category="Motor · EZ Drive"
    subtitle="All your EZ Drive policies, ordered by most recent."
    buy-href="/motor/ez-drive/buy"
  />
</template>
