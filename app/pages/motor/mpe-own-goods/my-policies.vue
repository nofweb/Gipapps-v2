<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <MotorPoliciesList
    family="third_party"
    variance="Motor Protect Extra (Own Goods)"
    category="Motor · MPE Own Goods"
    subtitle="All your Motor Protect Extra (Own Goods) policies, ordered by most recent."
    buy-href="/motor/mpe-own-goods/buy"
  />
</template>
