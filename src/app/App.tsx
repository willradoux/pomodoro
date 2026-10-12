import type { CSSProperties } from 'react'
import { BackgroundButton, BackgroundPanel, BlobBackdrop, GradientBackground, useBackground } from '../features/background'
import { ModePicker, SessionControls, TimerFace, UndoToast, usePomodoro } from '../features/timer'
import { GitHubIcon } from '../shared/ui/icons/GitHubIcon'
import { IconLink } from '../shared/ui/IconLink'
import './app.css'

const REPO_URL = 'https://github.com/willradoux/pomodoro'

export default function App() {
  const pomodoro = usePomodoro()
  const background = useBackground()

  return (
    <main className="app">
      <GradientBackground
        colors={background.colors}
        animate={background.prefs.animate}
        fallback={<BlobBackdrop colors={background.colors} animate={background.prefs.animate} />}
      />

      <h1 className="sr-only">Pomodoro</h1>

      <section className="stage" style={{ '--progress-color': background.progressColor } as CSSProperties}>
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

      <IconLink href={REPO_URL} label="Código no GitHub" className="repo-link surface">
        <GitHubIcon />
      </IconLink>

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
