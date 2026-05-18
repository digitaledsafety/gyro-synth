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

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.update();
    }

    resize() {
        if (this.waveformSvg) {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.waveformSvg.attr("viewBox", `0 0 ${width} ${height}`)
                .attr("width", width)
                .attr("height", height);

            this.xScale.range([0, width]);
            this.yScale.range([height, 0]);
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
        const svgWidth = this.waveformSvg.node().clientWidth;
        const svgHeight = this.waveformSvg.node().clientHeight;
        const minBarHeight = svgHeight * 0.01;
        const samplesPerBar = Math.floor(waveformArray.length / this.barCount);
        const barWidth = svgWidth / this.barCount;

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
            .attr("x", (d, i) => i * barWidth)
            .attr("width", barWidth * 0.8)
            .merge(bars)
            .attr("x", (d, i) => i * barWidth + (barWidth * 0.1))
            .attr("y", d => svgHeight - Math.max(minBarHeight, d * svgHeight))
            .attr("height", d => Math.max(minBarHeight, d * svgHeight))
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
