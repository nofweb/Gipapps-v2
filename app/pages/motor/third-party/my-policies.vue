<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorPoliciesList
    family="third_party"
    category="Motor · Third Party"
    subtitle="All your third-party motor policies, ordered by most recent."
    buy-href="/motor/third-party/buy"
  />
</template>
