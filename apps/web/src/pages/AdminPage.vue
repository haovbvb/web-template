<template>
  <section>
    <h2>Admin Page</h2>
    <p>This route requires users:admin permission.</p>
    <button v-permission="'org:manage'">Org Manage Action</button>
  </section>
</template>
