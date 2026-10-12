import { forwardRef, memo, useEffect } from 'react'
import { useHover } from '../../../shared/hooks/useHover'
import { useSpring } from '../../../shared/hooks/useSpring'
import { springs } from '../../../shared/lib/spring'
import { PlayPauseIcon } from '../../../shared/ui/icons/PlayPauseIcon'
import { PressButton } from '../../../shared/ui/PressButton'
import { useCountdown } from '../hooks/useCountdown'
import { durationOf, formatTime, MODES, primaryLabel, statusText, type TimerState } from '../model/timer'
import { Digits } from './Digits'
import { TimerRing, type TimerRingHandle } from './TimerRing'

type Props = {
  state: TimerState
  onPrimary: () => void
}

/** Card do timer: só o tempo e o botão principal. O estado é anunciado a leitores de tela. */
export const TimerFace = memo(
  forwardRef<TimerRingHandle, Props>(function TimerFace({ state, onPrimary }, ref) {
    const { ms, nextMs, stepMs } = useCountdown(state)
    const running = state.status === 'running'
    const status = statusText(state)
    const [hovered, hover] = useHover()
    const [h] = useSpring(hovered ? 1 : 0, springs.bouncy)

    useEffect(() => {
      document.title =
        state.status === 'idle'
          ? 'Pomodoro'
          : state.status === 'complete'
            ? status
            : `${formatTime(ms)} · ${MODES[state.mode].label}`
    }, [ms, state, status])

    return (
      <div className="card surface" data-status={state.status}>
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
        <div className="card-info">
          <Digits value={formatTime(ms)} />
        </div>

        <div className="play-area">
          <TimerRing
            ref={ref}
            fraction={(running ? nextMs : ms) / durationOf(state.mode)}
            glideMs={running ? stepMs : 0}
          />
          <PressButton className="play-hit" depth={0.96} aria-label={primaryLabel(state)} onClick={onPrimary} {...hover}>
            <span className="icon-motion" style={h === 0 ? undefined : { transform: `scale(${1 + 0.1 * h})` }}>
              <PlayPauseIcon playing={running} />
            </span>
          </PressButton>
        </div>
      </div>
    )
  }),
)
