/**
 * Visualizer class encapsulates all D3.js visualization logic.
 * Handles rendering the waveform and responding to resize events.
 */
class Visualizer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.waveformSvg = d3.select("#waveformSvg");
        this.barCount = 64;
        this.vizMode = 'waveform'; // 'waveform' or 'spectrum'
        this.colorScale = d3.scaleLinear()
            .domain([0, 0.5, 1])
            .range(["#3498db", "#f1c40f", "#e74c3c"]);

        this.xScale = d3.scaleLinear().domain([0, this.barCount - 1]);
        this.yScale = d3.scaleLinear().domain([0, 1]);

        this.svgWidth = 0;
        this.svgHeight = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.update();
    }

    resize() {
        if (this.waveformSvg) {
            this.svgWidth = window.innerWidth;
            this.svgHeight = window.innerHeight;

            this.waveformSvg.attr("viewBox", `0 0 ${this.svgWidth} ${this.svgHeight}`)
                .attr("width", this.svgWidth)
                .attr("height", this.svgHeight);

            this.xScale.range([0, this.svgWidth]);
            this.yScale.range([this.svgHeight, 0]);
        }
    }

    createRipple(x, y) {
        if (!this.waveformSvg) return;

        const svgElement = this.waveformSvg.node();
        const pt = svgElement.createSVGPoint();
        pt.x = x;
        pt.y = y;
        const svgP = pt.matrixTransform(svgElement.getScreenCTM().inverse());

        this.waveformSvg.append("circle")
            .attr("cx", svgP.x)
            .attr("cy", svgP.y)
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", "#3498db")
            .attr("stroke-width", 2)
            .attr("opacity", 0.8)
            .transition()
            .duration(800)
            .attr("r", 100)
            .attr("opacity", 0)
            .remove();
    }

    update() {
        if (!this.audioEngine.waveformAnalyzer || !this.waveformSvg || this.svgWidth === 0) {
            requestAnimationFrame(() => this.update());
            return;
        }

        const barData = [];
        const minBarHeight = this.svgHeight * 0.01;
        const barWidth = this.svgWidth / this.barCount;

        if (this.vizMode === 'waveform') {
            const waveformArray = this.audioEngine.waveformAnalyzer.getValue();
            const samplesPerBar = Math.floor(waveformArray.length / this.barCount);
            const visualGain = 2.0;

            for (let i = 0; i < this.barCount; i++) {
                let sum = 0;
                for (let j = 0; j < samplesPerBar; j++) {
                    sum += Math.min(1.0, Math.abs(waveformArray[i * samplesPerBar + j]) * visualGain);
                }
                barData.push(sum / samplesPerBar);
            }
        } else if (this.vizMode === 'spectrum' && this.audioEngine.spectrumAnalyzer) {
            const spectrumArray = this.audioEngine.spectrumAnalyzer.getValue();
            // We only take the lower half/relevant portion of spectrum for visual interest
            const relevantDataPoints = Math.floor(spectrumArray.length * 0.6);
            const samplesPerBar = Math.floor(relevantDataPoints / this.barCount);

            for (let i = 0; i < this.barCount; i++) {
                let max = -Infinity;
                for (let j = 0; j < samplesPerBar; j++) {
                    const val = spectrumArray[i * samplesPerBar + j];
                    if (val > max) max = val;
                }
                // Normalize dB values (-100 to 0 typical range) to 0-1
                const normalizedVal = Math.max(0, (max + 100) / 100);
                barData.push(normalizedVal);
            }
        }

        this.waveformSvg.selectAll(".bar")
            .data(barData)
            .join("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => i * barWidth + (barWidth * 0.1))
            .attr("y", d => this.svgHeight - Math.max(minBarHeight, d * this.svgHeight))
            .attr("width", barWidth * 0.8)
            .attr("height", d => Math.max(minBarHeight, d * this.svgHeight))
            .attr("fill", d => this.colorScale(d));

        const freq = this.audioEngine.getNormalizedFrequency();
        const display = document.getElementById('frequencyDisplay');
        if (display) {
            const note = Tone.Frequency(freq).toNote();
            display.textContent = `${freq.toFixed(2)} Hz (${note})`;
        }

        requestAnimationFrame(() => this.update());
    }
}
