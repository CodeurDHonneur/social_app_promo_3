import React from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { Provider } from 'react-redux'
import store from './store/store'

const App = () => {
  return (

    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
    // <div>App</div>
  )
}

export default App