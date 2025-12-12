import { createSlice } from "@reduxjs/toolkit";

const getStoredUser = () => {
    const raw = localStorage.getItem("currentUser");
    try {
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

//Création d'un slice Redux pour la gestion des données utilisateur de notre application
const userSlice = createSlice({
    name: "user", //Nom du slice 
    //l'état initial
    initialState: {
        //On récupère l'utilisateur stocké dans le localStorage
        currentUser: getStoredUser(),
        socket: null,
        //Tableau contenant la liste des utilisateurs connectés
        onlineUsers: []
    },
    reducers: {
        //Met à jour l'utilisateur actuel
        changeCurrentUser: (state, action) => {
            state.currentUser = action.payload
        },
        //Stocke l'objet socket dans Redux
        setSocket: (state, action) => {
            state.socket = action.payload;
        },
        //Met à jour la liste des utilisateur en ligne
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        }
    }
});


export const userActions = userSlice.actions;
// export const {changeCurrentUser, setSocket, setOnlineUsers} = userSlice.actions;


export default userSlice;

