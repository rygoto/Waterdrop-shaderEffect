import React, { FC, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ScreenPlane } from '../src/components/ScreenPlane'
import { CollisionSettting } from './components/CollisionSetting'
import { css } from '@emotion/css'

function App() {


  return (
    <div className={styles.container}>
      <Canvas
        camera={{
          position: [0, 0, 15],
          fov: 50,
          aspect: window.innerWidth / window.innerHeight,
          near: 0.1,
          far: 2000
        }}
        dpr={window.devicePixelRatio}>
        <color attach="background" args={['#000']} />
        <Suspense fallback={null}>
          <OrbitControls />
          {/*<CollisionSettting />*/}
          <ScreenPlane />
        </Suspense>
      </Canvas>
    </div>
  )
}

const styles = {
  container: css`
      position:relative;
      width:100vw;
      height:100vh;
    `
}

export default App
