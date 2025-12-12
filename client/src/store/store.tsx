import { configureStore } from "@reduxjs/toolkit";
import uiSlice from "./ui-slice";
import userSlice from "./user-slice";



const store = configureStore({
    reducer: {
        //Chaque slice devient une "branche" du state global
        ui: uiSlice.reducer,
        user: userSlice.reducer
    }
});

export default store;