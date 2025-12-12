import { createSlice } from "@reduxjs/toolkit";
import type ThemeType from "../types/theme.types";


const defaultTheme: ThemeType = {primaryColor: "", backgroundColor: ""};

const getStoredTheme = (): ThemeType => {
    const raw = localStorage.getItem("theme");
    try {
        return raw ? JSON.parse(raw) : defaultTheme;
    } catch (error) {
        return defaultTheme;
    }
}

// État initial de l'UI (Interface Utilisateur)
const initialState = {
    // Gère l'ouverture/fermeture de la modal du thème
    themeModalIsOpen: false,
 
    // Gère l'ouverture/fermeture de la modal d'édition du profil
    editProfileModalOpen: false,
 
    // Gère l'ouverture/fermeture de la modal d'édition d'un post
    editPostModalOpen: false,
 
    // Id du post à éditer (utile pour la modal d'édition)
    editPostId: "",
 
    // Thème de l'application, stocké dans le localStorage pour persister après reload
    theme: getStoredTheme()
};


const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        // === Thème ===
 
        // Ouvre la modal du thème
        openThemeModal: state => {
            // action.payload = true;
            state.themeModalIsOpen = true;
        },
 
        // Ferme la modal du thème
        closeThemeModal: state => {
            state.themeModalIsOpen = false;
        },
 
        // Change les couleurs du thème
        // action.payload contient l'objet { primaryColor, backgroundColor }
        changeTheme: (state, action) => {
            state.theme = action.payload;
        },
        // === Modal édition profil ===
 
        // Ouvre la modal d'édition du profil
        openEditProfileModal: state => {
            state.editProfileModalOpen = true;
        },
 
        // Ferme la modal d'édition du profil
        closeEditProfileModal: state => {
            state.editProfileModalOpen = false;
        },
 
        // === Modal édition d'un post ===
 
        // Ouvre la modal d'édition d'un post
        // action.payload = id du post à modifier
        openEditPostModal: (state, action) => {
            state.editPostModalOpen = true;
            state.editPostId = action.payload;
        },
 
        // Ferme la modal d'édition d'un post
        closeEditPostModal: state => {
            state.editPostModalOpen = false;
        }
    }
});


export const uiActions = uiSlice.actions;

export default uiSlice;