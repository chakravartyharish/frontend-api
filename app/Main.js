import React, { useState, useReducer, useEffect, Suspense } from "react"
import ReactDOM from "react-dom/client"
import { useImmerReducer } from "use-immer"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { CSSTransition } from "react-transition-group"
import Axios from "axios"

// Configure Axios default backend URL
Axios.defaults.baseURL = process.env.BACKENDURL || "https://mybackendapi-57ddcea28a50.herokuapp.com/"

// Import Context Providers
import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"

// Import Components
// Eagerly loaded components (critical for initial render)
import LoadingDotsIcon from "./components/LoadingDotsIcon"
import Header from "./components/Header"
import HomeGuest from "./components/HomeGuest"
import Home from "./components/Home"
import Footer from "./components/Footer"
import About from "./components/About"
import Terms from "./components/Terms"
import FlashMessages from "./components/FlashMessages"
import Profile from "./components/Profile"
import EditPost from "./components/EditPost"
import NotFound from "./components/NotFound"

// Lazily loaded components (loaded when needed)
const CreatePost = React.lazy(() => import("./components/CreatePost"))
const ViewSinglePost = React.lazy(() => import("./components/ViewSinglePost"))
const Search = React.lazy(() => import("./components/Search"))
const Chat = React.lazy(() => import("./components/Chat"))

/**
 * Main Application Component
 * Handles global state management, routing, and core application structure
 */
function Main() {
  // Initialize global state with user authentication and UI states
  const initialState = {
    loggedIn: Boolean(localStorage.getItem("complexappToken")),
    flashMessages: [],
    user: {
      token: localStorage.getItem("complexappToken"),
      username: localStorage.getItem("complexappUsername"),
      avatar: localStorage.getItem("complexappAvatar")
    },
    isSearchOpen: false,
    isChatOpen: false,
    unreadChatCount: 0
  }

  /**
   * Global state reducer function
   * Handles all state modifications using Immer for immutable updates
   * @param {Object} draft - Current state draft from Immer
   * @param {Object} action - Action object with type and optional payload
   */
  function ourReducer(draft, action) {
    switch (action.type) {
      case "login":
        draft.loggedIn = true
        draft.user = action.data
        return
      case "logout":
        draft.loggedIn = false
        return
      case "flashMessage":
        draft.flashMessages.push(action.value)
        return
      case "openSearch":
        draft.isSearchOpen = true
        return
      case "closeSearch":
        draft.isSearchOpen = false
        return
      case "toggleChat":
        draft.isChatOpen = !draft.isChatOpen
        return
      case "closeChat":
        draft.isChatOpen = false
        return
      case "incrementUnreadChatCount":
        draft.unreadChatCount++
        return
      case "clearUnreadChatCount":
        draft.unreadChatCount = 0
        return
    }
  }

  // Initialize state management with Immer reducer
  const [state, dispatch] = useImmerReducer(ourReducer, initialState)

  /**
   * Effect: Persist authentication state
   * Manages local storage updates when login state changes
   */
  useEffect(() => {
    if (state.loggedIn) {
      localStorage.setItem("complexappToken", state.user.token)
      localStorage.setItem("complexappUsername", state.user.username)
      localStorage.setItem("complexappAvatar", state.user.avatar)
    } else {
      localStorage.removeItem("complexappToken")
      localStorage.removeItem("complexappUsername")
      localStorage.removeItem("complexappAvatar")
    }
  }, [state.loggedIn])

  /**
   * Effect: Token validation
   * Checks if the user's token is still valid on initial load
   * Handles automatic logout if token is expired
   */
  useEffect(() => {
    if (state.loggedIn) {
      const ourRequest = Axios.CancelToken.source()
      async function fetchResults() {
        try {
          const response = await Axios.post("/checkToken", { token: state.user.token }, { cancelToken: ourRequest.token })
          if (!response.data) {
            dispatch({ type: "logout" })
            dispatch({ type: "flashMessage", value: "Your session has expired. Please log in again." })
          }
        } catch (e) {
          console.log("There was a problem or the request was cancelled.")
        }
      }
      fetchResults()
      return () => ourRequest.cancel() // Cleanup function to cancel request if component unmounts
    }
  }, [])

  return (
    // Provide global state and dispatch through context
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          {/* Global Flash Messages */}
          <FlashMessages messages={state.flashMessages} />
          <Header />
          
          {/* Main Content Area with Suspense for lazy-loaded routes */}
          <Suspense fallback={<LoadingDotsIcon />}>
            <Routes>
              {/* Profile Route with nested routes support */}
              <Route path="/profile/:username/*" element={<Profile />} />
              
              {/* Conditional Home Route based on auth state */}
              <Route path="/" element={state.loggedIn ? <Home /> : <HomeGuest />} />
              
              {/* Post Related Routes */}
              <Route path="/post/:id" element={<ViewSinglePost />} />
              <Route path="/post/:id/edit" element={<EditPost />} />
              <Route path="/create-post" element={<CreatePost />} />
              
              {/* Static Pages */}
              <Route path="/about-us" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Search Overlay with Animation */}
          <CSSTransition timeout={330} in={state.isSearchOpen} classNames="search-overlay" unmountOnExit>
            <div className="search-overlay">
              <Suspense fallback="">
                <Search />
              </Suspense>
            </div>
          </CSSTransition>

          {/* Conditional Chat Component */}
          <Suspense fallback="">
            {state.loggedIn && <Chat />}
          </Suspense>

          <Footer />
        </BrowserRouter>
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

// Initialize React root and render application
const root = ReactDOM.createRoot(document.querySelector("#app"))
root.render(<Main />)

// Enable Hot Module Replacement in development
if (module.hot) {
  module.hot.accept()
}
