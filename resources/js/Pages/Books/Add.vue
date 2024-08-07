<script setup>
  import { useForm } from '@inertiajs/vue3';
  import { ref } from 'vue';
  import StyledButton from '@/Components/StyledButton.vue';
  import Form from '@/Components/Form.vue';
  import FormLayout from '@/Layouts/FormLayout.vue';
  import GenreSelector from '@/Components/GenreSelector.vue';
  import YearSelector from '@/Components/YearSelector.vue';

  defineProps({
    errors: Object,
  });

  const form = useForm({
    title: null,
    author: null,
    pages: null,
    genre: '',
    publish_year: null,
    read: false,
    date_read: null,
    finished: false,
  });

  let isProcessing = ref(false);

  const submit = () => {
    // TODO: Find a better way to handle isProcessing value change
    isProcessing.value = true;
    form.post('/books/add');
    isProcessing.value = false;
  };
</script>

<template>
  <!-- TODO: Clean up file -->

  <Head title="Add a Book" />

  <FormLayout>
    <h1
      id="box-text"
      class="border-b border-bronze pb-1.5 text-3xl dark:border-tan"
    >
      Add Book
    </h1>

    <form method="POST" @submit.prevent="submit">
      <!-- Title -->
      <div class="text-md mt-4 flex flex-col space-y-1">
        <label class="text-left" for="title">Title</label>

        <input
          v-model="form.title"
          class="rounded-md border-none text-left"
          name="title"
          placeholder="What's it called?"
          required
          type="text"
        />

        <div v-if="errors.title" class="error">{{ errors.title }}</div>
      </div>

      <!-- Author -->
      <div class="text-md mt-4 flex flex-col space-y-1">
        <label class="text-left" for="author">Author</label>

        <input
          v-model="form.author"
          class="rounded-md border-none text-left"
          name="author"
          placeholder="Who wrote it?"
          required
          type="text"
        />

        <div v-if="errors.author" class="error">{{ errors.author }}</div>
      </div>

      <!-- Number of Pages -->
      <div class="text-md mt-4 flex flex-col space-y-2">
        <label class="text-left" for="pages">Pages</label>

        <input
          v-model="form.pages"
          class="rounded-md border-none text-left"
          max="3000"
          min="1"
          name="pages"
          placeholder="How many pages?"
          required
          type="number"
        />

        <div v-if="errors.pages" class="error">{{ errors.pages }}</div>
      </div>

      <!--Genres-->
      <div class="mt-4">
        <GenreSelector v-model="form.genre" />
        <div v-if="errors.genre" class="error">
          {{ errors.genre }}
        </div>
      </div>

      <!--Publish Year-->
      <div class="mt-4">
        <YearSelector v-model="form.publish_year" />
        <div v-if="errors.publish_year" class="error">
          {{ errors.publish_year }}
        </div>
      </div>

      <!-- Read Status -->
      <div
        class="mb-4 mt-6 flex flex-col items-center justify-center space-y-2 text-lg"
      >
        <div class="flex items-center justify-center">
          <input
            v-model="form.read"
            class="mr-1 rounded text-left"
            name="read"
            type="checkbox"
          />

          <label for="read">Read?</label>
        </div>

        <div v-if="form.read" class="flex items-center">
          <input
            v-model="form.finished"
            class="mr-1 rounded text-left"
            name="finished"
            type="checkbox"
          />
          <label for="finished">Finished?</label>
        </div>

        <div v-if="errors.read" class="error">{{ errors.read }}</div>
      </div>

      <!-- Conditional based on read status -->
      <div
        v-if="form.finished"
        class="flex flex-col items-center justify-center"
      >
        <label class="mb-2 text-center" for="date_read">
          When did you finish it?
        </label>

        <input
          v-model="form.date_read"
          class="mb-4 w-60 rounded-md border-none"
          name="date_read"
          type="date"
        />

        <div v-if="errors.date_read" class="error">{{ errors.dateRead }}</div>
      </div>

      <div class="mt-6 flex justify-center space-x-8">
        <StyledButton :isProcessing="isProcessing" type="submit">
          <span
            v-if="isProcessing"
            class="loading loading-spinner loading-sm"
          ></span>
          <span v-else>Add</span>
        </StyledButton>

        <StyledButton>
          <Link :disabled="isProcessing" href="/books">
            <span
              v-if="isProcessing"
              class="loading loading-spinner loading-sm"
            ></span>
            <span v-else>Go Back</span>
          </Link>
        </StyledButton>
      </div>
    </form>
  </FormLayout>
</template>
