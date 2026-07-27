<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorRenewSearch
    family="comprehensive"
    by-registration
    category="Motor · Comprehensive"
    subtitle="Search by vehicle registration number, then renew with one click."
  />
</template>
