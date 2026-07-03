      // Global variable for the audio engine
      const audioEngine = new AudioEngine();
      let visualizer = null;
      let interactionHandler = null;
      let wakeLock = null; // Screen wake lock object

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

        // Populate scale dropdown (InteractionHandler also does this but we need it here for initial setup if not handled there)
        const scaleSelect = document.getElementById('scaleSelect');
        for (const scaleName in audioEngine.availableScales) {
          const option = document.createElement('option');
          option.value = scaleName;
          option.textContent = scaleName;
          scaleSelect.appendChild(option);
        }
        scaleSelect.value = 'Off';
        document.getElementById('rootNoteSelect').disabled = true;

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

        // Call the function to request the wake lock
        requestWakeLock();
        // Re-acquire wake lock when the page becomes visible again
        document.addEventListener('visibilitychange', async () => {
          if (wakeLock !== null && document.visibilityState === 'visible') {
            await requestWakeLock();
          }
        });

        await audioEngine.init();
        visualizer.resize();
        audioEngine.updateMasterVolume();

        // Additional listener for startButton to acquire wake lock
        document.getElementById('startButton').addEventListener('click', () => {
            requestWakeLock();
        });
      });
