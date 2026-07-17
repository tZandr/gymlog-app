import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ActiveWorkoutProvider } from './context/ActiveWorkoutContext'
import './index.scss'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ActiveWorkoutProvider>
      <RouterProvider router={router} />
    </ActiveWorkoutProvider>
  </StrictMode>,
)
