import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Toaster } from './components/ui'
import Home from './pages/Home'
import Weight from './pages/Weight'
import Workouts from './pages/Workouts'
import WorkoutEdit from './pages/WorkoutEdit'
import Exercises from './pages/Exercises'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import ActiveWorkout from './pages/ActiveWorkout'
import AuthScreen, { MissingConfig, Splash } from './pages/AuthScreen'
import { isFirebaseConfigured } from './lib/firebase'
import { useSyncStatus } from './lib/sync'

/** שומר הכניסה: בלי משתמש מחובר רואים רק את מסך ההתחברות */
function AuthGate({ children }) {
  const { authReady, user } = useSyncStatus()
  if (!isFirebaseConfigured) return <MissingConfig />
  if (!authReady) return <Splash />
  if (!user) return <AuthScreen />
  // key לפי UID: החלפת משתמש מאפסת את כל המסכים
  return <React.Fragment key={user.uid}>{children}</React.Fragment>
}

export default function App() {
  return (
    <>
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="weight" element={<Weight />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="workouts/:id" element={<WorkoutEdit />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* מסך האימון הפעיל — מסך מלא בלי ניווט תחתון */}
            <Route path="active" element={<ActiveWorkout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
      <Toaster />
    </>
  )
}
