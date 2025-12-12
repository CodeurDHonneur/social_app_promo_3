import { createBrowserRouter, type RouteObject } from "react-router-dom";
import RootLayout from "./RootLayout";
import Bookmarks from "./pages/Bookmarks";
import Home from "./pages/Home";
import MessagesList from "./components/MessagesList";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import SinglePost from "./pages/SinglePost";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import ErrorPage from "./pages/ErrorPage";

const routes: RouteObject[] = ([
    {path: "/", 
        element: <RootLayout />,
        errorElement: <ErrorPage />, 
        children: [
            {index: true, element: <Home />},
            {path: "messages", element: <MessagesList />},
            {path: "messages/:receiverId", element: <Messages />},
            {path: "bookmarks", element: <Bookmarks />},
            {path: "users/:id", element: <Profile />},
            {path: "posts/:id", element: <SinglePost />},
        ]
    },
    {path: "/login", element: <Login />},
    {path: "/register", element: <Register />},
    {path: "/logout", element: <Logout />},
]);


const router = createBrowserRouter(routes);

export default router;