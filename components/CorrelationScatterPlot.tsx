import React from 'react';

interface DataPoint {
  id: string;
  name: string;
  academic: number;
  behavioral: number;
  category: 'high-achiever' | 'at-risk' | 'academic-support' | 'behavior-support' | 'normal';
}

interface CorrelationScatterPlotProps {
  data: DataPoint[];
  title?: string;
}

const CorrelationScatterPlot: React.FC<CorrelationScatterPlotProps> = ({ 
  data, 
  title = 'Academic vs Behavioral Performance' 
}) => {
  const width = 600;
  const height = 400;
  const padding = 60;
  
  // Chart dimensions
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  // Calculate scales
  const xScale = (value: number) => padding + (value / 100) * chartWidth;
  const yScale = (value: number) => height - padding - (value / 100) * chartHeight;
  
  // Category colors and labels
  const getCategoryStyle = (category: DataPoint['category']) => {
    switch (category) {
      case 'high-achiever':
        return { color: '#10b981', label: '🌟 High Achiever' };
      case 'at-risk':
        return { color: '#ef4444', label: '⚠️ At Risk' };
      case 'academic-support':
        return { color: '#3b82f6', label: '📚 Academic Support' };
      case 'behavior-support':
        return { color: '#f59e0b', label: '🎯 Behavior Support' };
      default:
        return { color: '#64748b', label: '✓ Good Standing' };
    }
  };
  
  // Get unique categories for legend
  const categories = Array.from(new Set(data.map(d => d.category)));
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{title}</h3>
      
      {/* SVG Chart */}
      <div className="flex justify-center">
        <svg 
          width={width} 
          height={height} 
          className="bg-slate-50 dark:bg-slate-900 rounded-lg"
        >
          {/* Grid lines */}
          <g className="opacity-20">
            {[0, 25, 50, 75, 100].map(value => (
              <g key={`grid-${value}`}>
                {/* Vertical grid */}
                <line
                  x1={xScale(value)}
                  y1={padding}
                  x2={xScale(value)}
                  y2={height - padding}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-400 dark:text-slate-600"
                />
                {/* Horizontal grid */}
                <line
                  x1={padding}
                  y1={yScale(value)}
                  x2={width - padding}
                  y2={yScale(value)}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-400 dark:text-slate-600"
                />
              </g>
            ))}
          </g>
          
          {/* Threshold lines */}
          {/* Academic threshold at 75 */}
          <line
            x1={padding}
            y1={yScale(75)}
            x2={width - padding}
            y2={yScale(75)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          {/* Behavioral threshold at 60 */}
          <line
            x1={xScale(60)}
            y1={padding}
            x2={xScale(60)}
            y2={height - padding}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const style = getCategoryStyle(point.category);
            return (
              <g key={point.id}>
                <circle
                  cx={xScale(point.behavioral)}
                  cy={yScale(point.academic)}
                  r="6"
                  fill={style.color}
                  opacity="0.7"
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <title>{`${point.name}\nAcademic: ${point.academic}%\nBehavioral: ${point.behavioral}%`}</title>
                </circle>
              </g>
            );
          })}
          
          {/* Axes */}
          <g>
            {/* X-axis */}
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-600 dark:text-slate-400"
            />
            {/* Y-axis */}
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-600 dark:text-slate-400"
            />
          </g>
          
          {/* Axis labels */}
          <g className="text-slate-600 dark:text-slate-400">
            {/* X-axis labels */}
            {[0, 25, 50, 75, 100].map(value => (
              <text
                key={`x-${value}`}
                x={xScale(value)}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
              >
                {value}
              </text>
            ))}
            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map(value => (
              <text
                key={`y-${value}`}
                x={padding - 15}
                y={yScale(value) + 4}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
              >
                {value}
              </text>
            ))}
          </g>
          
          {/* Axis titles */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="currentColor"
            className="text-slate-700 dark:text-slate-300"
          >
            Behavioral Performance (%)
          </text>
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="currentColor"
            className="text-slate-700 dark:text-slate-300"
            transform={`rotate(-90, 20, ${height / 2})`}
          >
            Academic Performance (%)
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-4 justify-center">
          {categories.map(category => {
            const style = getCategoryStyle(category);
            const count = data.filter(d => d.category === category).length;
            return (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: style.color }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {style.label} ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Interpretation guide */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <strong>Reading the Chart:</strong> Each dot represents a student. Position shows academic (vertical) 
          vs behavioral (horizontal) performance. Dashed red lines mark intervention thresholds (75% academic, 60% behavioral).
        </p>
      </div>
    </div>
  );
};

export default CorrelationScatterPlot;
