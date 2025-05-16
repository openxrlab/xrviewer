import { createStore } from '@reduxjs/toolkit';
// eslint-disable-next-line import/extensions
import rootReducer from './reducer.js';

const store = createStore(rootReducer);

export default store;
