<script>
  import { onMount } from "svelte";
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    Filler,
  } from "chart.js";
  import "chartjs-adapter-moment"; // för att stödja moment-baserad x-axel
  import moment from "moment";

  import { login, listenToTemperatureData } from "$lib/Firebase.js";

  // 🔧 Registrera komponenter innan första chart används
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  let canvas;
  let chart;

  function parseFirebaseData(dataObj) {
    const entries = Object.entries(dataObj || {});
    console.log(entries)
    return entries.map(([ts, val]) => ({
      x: new Date(Number(ts)*1000),
      y: val.temp - 1 // Correct -1 deg
    })).sort((a, b) => a.x - b.x);
  }

  function updateChart(dataPoints) {
    const now = new Date();

    const data = {
      datasets: [{
        label: "Temperatur",
        data: dataPoints,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
      }],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: true, text: "Temperatur 72h" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} °C`,
            title: ctx => new Date(ctx[0].label).toLocaleString("sv-SE"),
          }
        }
      },
      interaction: {
        mode: "nearest",
        intersect: false,
        axis: "x",
      },
      elements: {
        line: { tension: 0.2, borderWidth: 2 },
        point: { radius: 0.1 },
      },
      scales: {
        y: { suggestedMin: 5, suggestedMax: 20 },
        x: {
          type: "time",
          time: {
            unit: "day",
            displayFormats: { day: "DD MMM" }
          },
          min: moment(now).subtract(72, "hours").toISOString(),
          max: moment(now).add(3, "hours").toISOString(),
        }
      }
    };

    if (chart) {
      chart.data = data;
      chart.options = options;
      chart.update();
    } else {
      chart = new Chart(canvas, {
        type: "line",
        data,
        options,
      });
    }
  }

  onMount(async () => {
    try {
      listenToTemperatureData((rawData) => {
        const parsed = parseFirebaseData(rawData);
        console.log(parsed);
        updateChart(parsed);
      });
    } catch (err) {
      console.error("Error during init:", err.message);
    }
  });
</script>

<style>
  .chart-container {
    position: relative;
    height: 400px;
    width: 100%;
  }
</style>

<div class="chart-container">
  <canvas bind:this={canvas}></canvas>
</div>
