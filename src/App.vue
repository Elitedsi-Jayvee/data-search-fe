<script setup>
import axios from 'axios';
import { debounce } from 'lodash';
import { ref } from 'vue';
const baseUri = import.meta.env.VITE_DATA_SEARCH_API

const searchInput = ref();
const suggestionBox = ref([]);
const getSearch = debounce(async () => {
  // const mainString = "here sample text";
  // const searchStrings = ["here", "text"];

  // searchStrings.every(str => mainString.includes(str));

  const { data } = await axios.post(baseUri, { query: searchInput.value });
  const result = await data.suggestions;
  suggestionBox.value = result;
  if(searchInput.value.length === 0) reset();
},500);
const reset = () =>{
  suggestionBox.value = [];
  
}

</script>

<template>
  <div class="container">
    <input type="text" v-model="searchInput" @keyup="getSearch">
    <div class="suggestions" >
      <em v-if="suggestionBox.length == 0"> Search for a vehicle...</em>
      <ul v-else>
        <li v-for="(data,index) in suggestionBox" :key="index">{{  data.name }}</li>
      </ul>
    </div>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

input {
  padding: 5px;
}

.suggestions {
  border: 1px solid black;
  width: 100%;
  height: 80vh;
  padding: 20px;
  overflow-y: auto;
}
</style>
