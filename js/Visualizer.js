/**
 * Visualizer class encapsulates all D3.js visualization logic.
 * Handles rendering the waveform and responding to resize events.
 */
class Visualizer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.waveformSvg = d3.select("#waveformSvg");
        this.barCount = 64;
        this.colorScale = d3.scaleLinear()
            .domain([0, 0.5, 1])
            .range(["#3498db", "#f1c40f", "#e74c3c"]);

        this.xScale = d3.scaleLinear().domain([0, this.barCount - 1]);
        this.yScale = d3.scaleLinear().domain([0, 1]);

        // Cached dimensions to avoid DOM queries in the update loop
        this.svgWidth = 0;
        this.svgHeight = 0;
        this.barWidth = 0;

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
            this.barWidth = this.svgWidth / this.barCount;
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
        if (!this.audioEngine.waveformAnalyzer || !this.waveformSvg) {
            requestAnimationFrame(() => this.update());
            return;
        }

        const waveformArray = this.audioEngine.waveformAnalyzer.getValue();
        const minBarHeight = this.svgHeight * 0.01;
        const samplesPerBar = Math.floor(waveformArray.length / this.barCount);

        const barData = [];
        const visualGain = 2.0;
        for (let i = 0; i < this.barCount; i++) {
            let sum = 0;
            for (let j = 0; j < samplesPerBar; j++) {
                sum += Math.min(1.0, Math.abs(waveformArray[i * samplesPerBar + j]) * visualGain);
            }
            barData.push(sum / samplesPerBar);
        }

        const bars = this.waveformSvg.selectAll(".bar").data(barData);

        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => i * this.barWidth)
            .attr("width", this.barWidth * 0.8)
            .merge(bars)
            .attr("x", (d, i) => i * this.barWidth + (this.barWidth * 0.1))
            .attr("y", d => this.svgHeight - Math.max(minBarHeight, d * this.svgHeight))
            .attr("height", d => Math.max(minBarHeight, d * this.svgHeight))
            .attr("fill", d => this.colorScale(d));

        bars.exit().remove();

        const freq = this.audioEngine.getNormalizedFrequency();
        const display = document.getElementById('frequencyDisplay');
        if (display) {
            const note = Tone.Frequency(freq).toNote();
            display.textContent = `${freq.toFixed(2)} Hz (${note})`;
        }

        requestAnimationFrame(() => this.update());
    }
}
