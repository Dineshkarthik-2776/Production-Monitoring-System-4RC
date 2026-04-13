import React, { useMemo } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Line, Bar } from "react-chartjs-2";
import { useApiData } from "../context/ApiContext";
import "../css/charts.css";

defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.color = "black";

// 🔹 Plugin for highlighting area where Act > Std (only for Line charts)
const highlightPlugin = {
  id: "highlightAbove",
  beforeDatasetsDraw(chart, args, opts) {
    if (!chart.data.datasets[1]) return;
    const {
      ctx,
      scales: { x, y },
    } = chart;
    const act = chart.data.datasets[opts.actDataset]?.data;
    const std = chart.data.datasets[opts.stdDataset]?.data;
    if (!act || !std) return;

    ctx.save();
    ctx.fillStyle = opts.color;

    ctx.beginPath();
    for (let i = 0; i < act.length; i++) {
      const xPos = x.getPixelForValue(i);
      const yAct = y.getPixelForValue(act[i]);
      if (i === 0) ctx.moveTo(xPos, yAct);
      else ctx.lineTo(xPos, yAct);
    }

    for (let i = act.length - 1; i >= 0; i--) {
      const xPos = x.getPixelForValue(i);
      const yStd = y.getPixelForValue(std[i]);
      ctx.lineTo(xPos, yStd);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
};

const Charts = () => {
  const { changeoverData, loading, error, selectedRecipe } = useApiData();

  // Process API data into chart format
  const chartDataList = useMemo(() => {
    if (!changeoverData?.table_data) return [];

    // Filter function for recipe
    const filterByRecipe = (details) => {
      if (!selectedRecipe) return details;
      return details.filter(detail => 
        detail.material && detail.material.includes(selectedRecipe)
      );
    };

    const charts = [];

    // Create line charts for each style type
    changeoverData.table_data.forEach((styleData) => {
      if (styleData.details && styleData.details.length > 0) {
        const filteredDetails = filterByRecipe(styleData.details);
        if (filteredDetails.length > 0) {
          charts.push({
            title: styleData.type,
            type: "line",
            data: filteredDetails.map((detail, index) => ({
              id: index + 1,
              material: detail.material,
              value: detail.act,
              std: detail.Std,
              start_time: detail.start_time,
            })),
          });
        }
      }
    });

    // Add bar chart for overshoot categories
    if (changeoverData?.bar_chart_data && changeoverData.bar_chart_data.length > 0) {
      charts.push({
        title: "Overshoot Categories",
        type: "bar",
        data: changeoverData.bar_chart_data.map((item) => ({
          category: item.category,
          value: item.value,
        })),
      });
    }

    return charts;
  }, [changeoverData, selectedRecipe]);

  // Loading state
  if (loading && !changeoverData) {
    return (
      <div className="ch-loading-container">
        <div className="ch-spinner"></div>
        <p className="ch-loading-text">Loading charts...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="ch-error-container">
        <svg className="ch-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="ch-error-text">{error}</p>
      </div>
    );
  }

  // Empty state
  if (chartDataList.length === 0) {
    return (
      <div className="ch-empty-container">
        <svg className="ch-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="ch-empty-text">No chart data available for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {chartDataList.map((chartItem, index) => (
        <div className="chart" key={index}>
          {chartItem.type === "line" ? (
            <Line
              data={{
                labels: chartItem.data.map((d) => d.id),
                datasets: [
                  {
                    label: "Act time",
                    data: chartItem.data.map((d) => d.value),
                    borderColor: "blue",
                    backgroundColor: "blue",
                    borderWidth: 2,
                    tension: 0,
                    fill: false,
                  },
                  {
                    label: "Std time",
                    data: chartItem.data.map((d) => d.std),
                    borderColor: "yellow",
                    backgroundColor: "yellow",
                    borderWidth: 2,
                    tension: 0,
                    fill: false,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    labels: {
                      color: "black",
                    },
                  },
                  title: {
                    display: true,
                    text: chartItem.title,
                  },
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        const index = context[0].dataIndex;
                        const data = chartItem.data[index];
                        return data.material || `Recipe ${context[0].label}`;
                      },
                      afterTitle: function(context) {
                        const index = context[0].dataIndex;
                        const data = chartItem.data[index];
                        if (data.start_time) {
                          const timestamp = data.start_time.replace('T', ' ').replace('Z', '').substring(0, 19);
                          return `Start Time: ${timestamp}`;
                        }
                        return '';
                      },
                      label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value.toFixed(2)} min`;
                      },
                    },
                  },
                  highlightAbove: {
                    actDataset: 0,
                    stdDataset: 1,
                    color: "rgba(248, 38, 38, 0.4)",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: { color: "#060606ff" },
                    grid: { color: "rgba(0, 0, 0, 0.08)" },
                  },
                  x: {
                    ticks: { color: "#040404ff" },
                    grid: { color: "rgba(9, 9, 9, 0.3)" },
                  },
                },
              }}
              plugins={[highlightPlugin]}
            />
          ) : (
            <Bar
              data={{
                labels: chartItem.data.map((d) => d.category),
                datasets: [
                  {
                    data: chartItem.data.map((d) => d.value),
                    backgroundColor: [
                      "rgba(54, 162, 235, 0.6)",
                      "rgba(255, 206, 86, 0.6)",
                      "rgba(75, 192, 192, 0.6)",
                      "rgba(255, 99, 132, 0.6)",
                    ],
                    borderColor: [
                      "rgba(54, 162, 235, 1)",
                      "rgba(255, 206, 86, 1)",
                      "rgba(75, 192, 192, 1)",
                      "rgba(255, 99, 132, 1)",
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return context.parsed.y;
                      },
                    },
                  },
                  title: {
                    display: true,
                    text: chartItem.title,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { color: "#060606ff" },
                    grid: { color: "rgba(0, 0, 0, 0.08)" },
                  },
                  x: {
                    ticks: { color: "#040404ff" },
                    grid: { color: "rgba(9, 9, 9, 0.3)" },
                  },
                },
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Charts;
