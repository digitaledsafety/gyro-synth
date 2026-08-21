      // Global variable for the audio engine
      const audioEngine = new AudioEngine();
      let visualizer = null;
      let interactionHandler = null;
      let wakeLock = null; // Screen wake lock object
      let isAppStarted = false; // State tracking variable for wake lock management

      // Function to request a screen wake lock
      async function requestWakeLock() {
        try {
          if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
              wakeLock = null;
            });
          }
        } catch (err) {
          console.error('Error acquiring wake lock:', err);
        }
      }

      // Main script execution when the DOM is fully loaded
      document.addEventListener('DOMContentLoaded', async () => {
        visualizer = new Visualizer(audioEngine);
        interactionHandler = new InteractionHandler(audioEngine, visualizer);

        // Register the service worker
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
              .then(registration => {
                //console.log('ServiceWorker registered');
              })
              .catch(registrationError => {
                console.error('ServiceWorker registration failed:', registrationError);
              });
          });
        }

        // Re-acquire wake lock when the page becomes visible again if app has started
        document.addEventListener('visibilitychange', async () => {
          if (isAppStarted && wakeLock === null && document.visibilityState === 'visible') {
            await requestWakeLock();
          }
        });

        await audioEngine.init();
        visualizer.resize();
        audioEngine.updateMasterVolume();

        // Additional listener for startButton to acquire wake lock and update isAppStarted
        document.getElementById('startButton').addEventListener('click', () => {
            isAppStarted = true;
            requestWakeLock();
        });
      });
