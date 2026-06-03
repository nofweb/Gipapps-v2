<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorPoliciesList
    family="comprehensive"
    variance="EZ Drive Plus"
    category="Motor · EZ Drive Plus"
    subtitle="All your EZ Drive Plus policies, ordered by most recent."
    buy-href="/motor/ez-drive-plus/buy"
  />
</template>
