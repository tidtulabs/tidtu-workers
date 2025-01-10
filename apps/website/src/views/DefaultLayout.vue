<script setup lang="ts">
import { RouterView } from "vue-router";
import HeaderView from "@/views/HeaderView.vue";
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background relative">
    <header
      class="sticky z-40 top-0 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div class="container flex h-14 max-w-screen-2xl items-center">
        <HeaderView />
      </div>
    </header>
    <div class="flex-1 bg-background">
      <main class="relative lg:gap-10">
          <RouterView />
      </main>
    </div>
  </div>
</template>

