import { desktopCapturer, screen } from 'electron'
import type { Screenshot } from '../types'

export class ScreenCapture {
  async captureScreen(): Promise<Screenshot | null> {
    try {
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width, height } = primaryDisplay.bounds

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.floor(width * 0.75), // 75% resolution - balance between quality and cost
          height: Math.floor(height * 0.75)
        }
      })

      if (sources.length === 0) {
        console.error('[ScreenCapture] No screen sources available')
        return null
      }

      const primarySource = sources[0]
      const thumbnail = primarySource.thumbnail

      return {
        buffer: thumbnail.toPNG(),
        timestamp: Date.now(),
        width: thumbnail.getSize().width,
        height: thumbnail.getSize().height
      }
    } catch (error) {
      console.error('[ScreenCapture] Error capturing screen:', error)
      return null
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      // On macOS, this will trigger the screen recording permission dialog
      await desktopCapturer.getSources({ types: ['screen'] })
      return true
    } catch (error) {
      console.error('[ScreenCapture] Permission denied:', error)
      return false
    }
  }
}
