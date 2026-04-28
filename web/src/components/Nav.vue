<template>
  <nav class="nav">
    <div class="nav-header">
      <div class="brand">
        <!-- <div class="brand-logo">
          <i class="bi bi-layers"></i>
        </div> -->
        <img src="/logo.png" alt="" />
        <h1 class="brand-text">PTKV4</h1>
      </div>
    </div>

    <ul class="nav-menu">
      <li v-for="(item, index) in navList" :key="index">
        <RouterLink :to="item.path" class="nav-item" :class="{ 'nav-item-active': $route.path === item.path }">
          <span class="nav-icon">
            <i :class="item.icon"></i>
          </span>
          <span class="nav-text">{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="nav-footer">
      <div class="version-badge">v4.0</div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

const navList = ref([
  { name: 'Home', path: '/', icon: 'bi bi-house' },
  { name: 'Translation', path: '/translation', icon: 'bi bi-translate' },
  { name: 'Packaged', path: '/packaged', icon: 'bi bi-box-seam' },
]);
</script>

<style lang="scss" scoped>
.nav {
  width: 240px;
  background: var(--color-white);
  border-right: 1px solid var(--border-light);
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: var(--z-base);

  .nav-header {
    height: 63px;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;

    .brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);

      .brand-logo {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-white);
        box-shadow: var(--shadow-sm);

        i {
          font-size: 20px;
        }
      }

      .brand-text {
        position: relative;
        top: 2px;
        font-size: 28px;
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        letter-spacing: -0.02em;
        font-family: 'Cascadia Mono';
      }
    }
  }

  .nav-menu {
    flex: 1;
    list-style: none;
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-3) var(--spacing-4);
      border-radius: var(--radius-base);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all var(--transition-fast);
      font-weight: var(--font-weight-medium);
      position: relative;

      .nav-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        i {
          font-size: 18px;
        }
      }

      .nav-text {
        font-size: var(--font-size-sm);
      }

      &:hover {
        background: var(--color-gray-50);
        color: var(--text-primary);
      }

      &.nav-item-active {
        background: var(--color-primary-50);
        color: var(--color-primary-600);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--color-primary-500);
          border-radius: 0 var(--radius-full) var(--radius-full) 0;
        }
      }
    }
  }

  .nav-footer {
    padding: var(--spacing-4);
    border-top: 1px solid var(--border-light);

    .version-badge {
      padding: var(--spacing-2) var(--spacing-3);
      background: var(--color-gray-50);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-base);
      text-align: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-tertiary);
      font-family: var(--font-family-mono);
    }
  }
}
</style>
