<script>
    import { onMount } from 'svelte';
    import Chart, { elements } from 'chart.js/auto';
    import 'moment'
    import 'chartjs-adapter-moment';

    let chart;
    let canvas;


    // Funktion för att generera en array med fakade data
    function generateData() {
        const data = [{timestamp: new Date(2024, 10, 20, 22).getTime(), sensor1:{temperatur: 18},sensor2:{temperatur: 18}}];
        const startDate = new Date(2024, 10, 20, 22); // Börjar 28 april 2024 kl. 19:00

        for (let i = 0; i < 140; i++) {
        const timestamp = new Date(
            startDate.getTime() + i * 0.5 * 60 * 60 * 1000
        );
        const temperature = ((0.5- Math.random()) * 0.3 + parseFloat(data[i].sensor1.temperatur)).toFixed(1); // Temperatur mellan 5.0 och 20.0
        const temperature2 = ((0.5- Math.random()) * 0.3 + parseFloat(data[i].sensor2.temperatur)).toFixed(1); // Temperatur mellan 5.0 och 20.0
        data.push({
            timestamp: timestamp.getTime(), // Format: "YYYY-MM-DD HH:mm"
            sensor1:{temperatur: temperature},
            sensor2:{temperatur: temperature2},
        });
        }
        for (let i = 30; i < 40; i++) {
          data[i].sensor1.temperatur = NaN;
        }

        return data;
    }

    let indata = generateData();

    indata = indata.sort((a,b) => a.timestamp - b.timestamp)
    const now = new Date();
    const data = {
        datasets: [
            {
                label: "Sensor 1",
                data: indata.map((x) => ({
                    x: x.timestamp, // x-axis is timestamp
                    y: parseFloat(x.sensor1.temperatur), // y-axis is temperature
                })),
            },
            {
                label: "Sensor 2",
                data: indata.map((x) => ({
                    x: x.timestamp, // x-axis is timestamp
                    y: parseFloat(x.sensor2.temperatur), // y-axis is temperature
                })),
            },
        ],
    };
  
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {text:"Temperatur 72h", display: true},
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    label = context.parsed.y + " °C"
                    return label;
                },
                title: function(context) {
                    return new Date(context[0].label).toLocaleString("se-sw");
                }
            }
        }
      },
      interaction: {
        mode: 'nearest', // Finds the nearest point
        intersect: false, // Allows detecting even if not directly over a point
        axis: 'x', // Restrict nearest point search to the x-axis
    },
      elements: {
        line: {
            tension: 0.2
        },
        point: {
            radius: 1
        }
      },
      scales: {
        y: {
            suggestedMin: 0,
            suggestedMax: 20
        },
        x: {
            display: true,
            type: "time",
            time: {
                unit: 'day',
                displayFormats: {
                    day: 'DD MMM'
                }
            },
            min: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
            max: new Date().toISOString(),
            
        }
      },
    };
  
    onMount(() => {
      chart = new Chart(canvas, {
        type: 'line',
        data,
        options,
      });
        
      return () => {
        chart.destroy();
      };
    });
  </script>
  
  <canvas bind:this={canvas}></canvas>
  
  <style>
    canvas {
      margin: 0 auto;
    }
  </style>
  