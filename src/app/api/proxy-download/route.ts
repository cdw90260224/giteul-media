import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    let referer = '';
    try {
      const parsedUrl = new URL(url);
      referer = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch (e) {
      // Ignore
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer
      }
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch from remote: ${response.status} ${response.statusText}`, { status: response.status });
    }

    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    const filename = searchParams.get('filename') || 'attachment.file';
    if (contentType) headers.set('Content-Type', contentType);
    
    // Force UTF-8 filename encoding to prevent Korean text garbling
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('Proxy download error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
