import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const COINS = ['ETHUSDT', 'BNBUSDT', 'DOTUSDT'];
const INTERVALS = ['1m', '3m', '5m'];

const BinanceMarketData = () => {
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [selectedInterval, setSelectedInterval] = useState(INTERVALS[0]);
  const [chartData, setChartData] = useState({});
  const ws = useRef(null);

  useEffect(() => {
    // Load data from local storage
    const storedData = localStorage.getItem('chartData');
    if (storedData) {
      setChartData(JSON.parse(storedData));
    }

    // Connect to WebSocket
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedCoin, selectedInterval]);

  useEffect(() => {
    // Save data to local storage
    localStorage.setItem('chartData', JSON.stringify(chartData));
  }, [chartData]);

  const connectWebSocket = () => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedCoin.toLowerCase()}@kline_${selectedInterval}`);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const { t: time, o: open, h: high, l: low, c: close } = message.k;

      setChartData((prevData) => {
        const newData = { ...prevData };
        if (!newData[selectedCoin]) {
          newData[selectedCoin] = {};
        }
        if (!newData[selectedCoin][selectedInterval]) {
          newData[selectedCoin][selectedInterval] = [];
        }

        newData[selectedCoin][selectedInterval].push({ time, open: parseFloat(open), high: parseFloat(high), low: parseFloat(low), close: parseFloat(close) });

        // Keep only the last 100 candles
        if (newData[selectedCoin][selectedInterval].length > 100) {
          newData[selectedCoin][selectedInterval] = newData[selectedCoin][selectedInterval].slice(-100);
        }

        return newData;
      });
    };
  };

  const handleCoinChange = (coin) => {
    setSelectedCoin(coin);
  };

  const handleIntervalChange = (interval) => {
    setSelectedInterval(interval);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedCoin} - ${selectedInterval}`,
      },
    },
  };

  const prepareChartData = () => {
    if (!chartData[selectedCoin] || !chartData[selectedCoin][selectedInterval]) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const data = chartData[selectedCoin][selectedInterval];
    return {
      labels: data.map((d) => new Date(d.time).toLocaleTimeString()),
      datasets: [
        {
          label: 'Close Price',
          data: data.map((d) => d.close),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
        {
          label: 'High Price',
          data: data.map((d) => d.high),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
        },
        {
          label: 'Low Price',
          data: data.map((d) => d.low),
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1,
        },
      ],
    };
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Binance Market Data</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                  {selectedCoin}
                  <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                </Menu.Button>
                <Menu.Items className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {COINS.map((coin) => (
                      <Menu.Item key={coin}>
                        {({ active }) => (
                          <button
                            onClick={() => handleCoinChange(coin)}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            {coin}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>
            </div>
            <div className="flex space-x-2">
              {INTERVALS.map((interval) => (
                <button
                  key={interval}
                  onClick={() => handleIntervalChange(interval)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedInterval === interval
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '400px' }}>
            <Line options={chartOptions} data={prepareChartData()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinanceMarketData;