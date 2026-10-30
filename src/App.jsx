import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Toaster } from './components/ui'
import Home from './pages/Home'
import Weight from './pages/Weight'
import Sugar from './pages/Sugar'
import Pressure from './pages/Pressure'
import Nutrition from './pages/Nutrition'
import Report from './pages/Report'
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
              <Route path="sugar" element={<Sugar />} />
              <Route path="pressure" element={<Pressure />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="workouts/:id" element={<WorkoutEdit />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* מסך האימון הפעיל — מסך מלא בלי ניווט תחתון */}
            <Route path="active" element={<ActiveWorkout />} />
            {/* דוח לרופא — מסך מלא להדפסה / שמירה כ-PDF */}
            <Route path="report" element={<Report />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
      <Toaster />
    </>
  )
}
