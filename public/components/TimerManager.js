export class TimerManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  start() {
    const startTime = performance.now();
    
    const timerId = setInterval(() => {
      const currentTime = performance.now();
      const elapsed = (currentTime - startTime) / 1000;
      this.stateManager.updateState('timing.currentElapsed', elapsed.toFixed(1));
    }, 100);

    this.stateManager.updateTiming({
      startTime,
      timerId,
      currentElapsed: 0
    });
  }

  stop() {
    const state = this.stateManager.getState();
    const { timerId, startTime } = state.timing;
    
    if (timerId) {
      clearInterval(timerId);
    }
    
    const endTime = performance.now();
    const totalElapsed = startTime ? (endTime - startTime) / 1000 : 0;
    
    this.stateManager.updateTiming({
      timerId: null,
      currentElapsed: totalElapsed.toFixed(1)
    });
    
    return totalElapsed.toFixed(1);
  }

  reset() {
    this.stop();
    this.stateManager.updateTiming({
      startTime: null,
      currentElapsed: 0
    });
  }
}