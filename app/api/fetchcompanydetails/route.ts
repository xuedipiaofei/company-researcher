// app/api/fetchcompanydetails/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    // 从环境变量获取 API token (使用 THECOMPANIES_API_TOKEN 或 DEEPSEEK_API_KEY)
    const apiToken = process.env.THECOMPANIES_API_TOKEN || process.env.DEEPSEEK_API_KEY;

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token not configured. Please set THECOMPANIES_API_TOKEN in .env.local' },
        { status: 500 }
      );
    }

    try {
      // 动态导入 SDK (ESM 模块)
      const { default: createClient } = await import('@thecompaniesapi/sdk');
      
      // 初始化 SDK 客户端
      const tca = createClient({
        apiToken: apiToken,
      });

      // 通过域名获取公司信息
      const response = await tca.fetchCompany({
        domain: domain,
      });

      // 处理响应
      if (!response) {
        return NextResponse.json(
          { error: 'No data returned from API' },
          { status: 400 }
        );
      }

      // 类型断言来处理响应
      const responseObj = response as any;
      
      // 检查是否有错误
      if (responseObj.error) {
        const errorMessage = typeof responseObj.error === 'string' 
          ? responseObj.error 
          : JSON.stringify(responseObj.error);
        return NextResponse.json(
          { error: `API Error: ${errorMessage}` },
          { status: 400 }
        );
      }

      // 返回数据
      const data = responseObj.data || responseObj;
      return NextResponse.json({ data });
    } catch (sdkError) {
      // 如果 SDK 不可用，尝试直接调用 API
      console.log('SDK import failed, trying direct API call:', sdkError);
      
      const apiResponse = await fetch('https://api.thecompaniesapi.com/v1/companies/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          domain: domain,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        return NextResponse.json(
          { error: `API Error: ${errorData.message || 'Unknown error'}` },
          { status: apiResponse.status }
        );
      }

      const result = await apiResponse.json();
      return NextResponse.json({ data: result });
    }
  } catch (error) {
    console.error('Error fetching company details:', error);
    return NextResponse.json(
      { error: `Failed to fetch company details: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

