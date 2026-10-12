/** Notifica só com a aba em segundo plano (em primeiro plano, o alarme e o anel bastam). */
export function notify(body: string) {
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    new Notification('Pomodoro', { body })
  }
}

export function askNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
}
