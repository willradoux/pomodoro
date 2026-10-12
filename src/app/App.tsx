import { BackgroundButton, BackgroundPanel, BlobBackdrop, GradientBackground, useBackground } from '../features/background'
import { ModePicker, SessionControls, TimerFace, UndoToast, usePomodoro } from '../features/timer'
import './app.css'

export default function App() {
  const pomodoro = usePomodoro()
  const background = useBackground()

  return (
    <main className="app">
      <GradientBackground colors={background.colors} animate={background.prefs.animate} fallback={<BlobBackdrop />} />

      <h1 className="sr-only">Pomodoro</h1>

      <section className="stage">
        <ModePicker value={pomodoro.state.mode} onChange={pomodoro.changeMode} />
        <div className="card-wrap">
          <TimerFace ref={pomodoro.ring} state={pomodoro.state} onPrimary={pomodoro.primary} />
        </div>
        <div className="secondary-row">
          <SessionControls
            canReset={pomodoro.state.status !== 'idle'}
            onReset={pomodoro.resetSession}
            soundOn={pomodoro.soundOn}
            onToggleSound={pomodoro.toggleSound}
          />
          <BackgroundButton anchor={background.anchor} expanded={background.panelOpen} onOpen={background.openPanel} />
        </div>
      </section>

      <UndoToast toast={pomodoro.toast} onUndo={pomodoro.undo} onDismiss={pomodoro.dismissToast} />

      <BackgroundPanel
        open={background.panelOpen}
        onClose={background.closePanel}
        value={background.prefs.id}
        onChange={background.select}
        animate={background.prefs.animate}
        onAnimateChange={background.setAnimate}
        anchor={background.anchor}
      />
    </main>
  )
}
