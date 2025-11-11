'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface CompanyDetailsDisplayProps {
  domain: string;
}

interface JsonTreeNodeProps {
  nodeKey: string;
  value: any;
  level: number;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({ nodeKey, value, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // 默认展开前两层
  const [copied, setCopied] = useState(false);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPrimitiveDisplay = (val: any) => {
    if (typeof val === 'string') {
      return `"${val}"`;
    }
    if (typeof val === 'boolean') {
      return val ? 'true' : 'false';
    }
    if (val === null) {
      return 'null';
    }
    return String(val);
  };

  const getIndentClass = (level: number) => {
    const indentMap: { [key: number]: string } = {
      0: 'ml-0',
      1: 'ml-4',
      2: 'ml-8',
      3: 'ml-12',
      4: 'ml-16',
      5: 'ml-20',
      6: 'ml-24',
    };
    return indentMap[Math.min(level, 6)] || 'ml-24';
  };

  const indent = getIndentClass(level);

  return (
    <div className={`${indent}`}>
      <div className="flex items-start py-1 group">
        {isExpandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-5 h-5 mr-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        )}
        {!isExpandable && <div className="w-5 mr-1" />}

        <span className="text-cyan-600 font-medium">{nodeKey}</span>
        <span className="text-gray-600 mx-1">:</span>

        {!isExpandable ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-800">{getPrimitiveDisplay(value)}</span>
            <button
              onClick={() => handleCopy(getPrimitiveDisplay(value))}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
            >
              {copied ? (
                <Check size={14} className="text-green-600" />
              ) : (
                <Copy size={14} className="text-gray-500" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-gray-600">
            {isArray ? `[${value.length}]` : `{...}`}
          </span>
        )}
      </div>

      {isExpandable && isExpanded && (
        <div>
          {isArray ? (
            value.map((item: any, index: number) => (
              <JsonTreeNode
                key={`${nodeKey}-${index}`}
                nodeKey={`[${index}]`}
                value={item}
                level={level + 1}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]: [string, any]) => (
              <JsonTreeNode
                key={`${nodeKey}-${key}`}
                nodeKey={key}
                value={val}
                level={level + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default function CompanyDetailsDisplay({ domain }: CompanyDetailsDisplayProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/fetchcompanydetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domain }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch company details');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching company details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (domain) {
      fetchData();
    }
  }, [domain]);

  if (loading) {
    return (
      <div>
        <h3 className="text-2xl font-normal pb-4">Company Details</h3>
        <div className="bg-white rounded-none p-6 border border-gray-200 mt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-2xl font-normal pb-4">Company Details</h3>
        <div className="bg-white rounded-none p-6 border border-gray-200 mt-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">⚠️ Error loading company details</p>
            <p className="text-sm mt-2 break-words">{error}</p>
            <div className="text-xs mt-3 text-red-600">
              <p>💡 Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Check if THECOMPANIES_API_TOKEN is configured</li>
                <li>Verify the API token is valid</li>
                <li>Check if the company domain exists</li>
                <li>Check browser console for more details (F12)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h3 className="text-2xl font-normal pb-4">Company Details</h3>
        <div className="bg-white rounded-none p-6 border border-gray-200 mt-6">
          <p className="text-gray-500">No company details available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-normal pb-4">Company Details</h3>
      <div className="bg-white rounded-none p-6 border border-gray-200 mt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          >
            {isExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {isExpanded && (
          <div className="font-mono text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto max-h-[600px] overflow-y-auto">
            <div className="text-gray-800 space-y-0">
              <span className="text-gray-600">{'{'}</span>
              <div>
                {Object.entries(data).map(([key, value]: [string, any]) => (
                  <JsonTreeNode
                    key={key}
                    nodeKey={key}
                    value={value}
                    level={1}
                  />
                ))}
              </div>
              <span className="text-gray-600">{'}'}</span>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <p className="font-medium">💡 提示: 点击箭头展开/折叠部分。将鼠标悬停在值上可复制它们。</p>
        </div>
      </div>
    </div>
  );
}

